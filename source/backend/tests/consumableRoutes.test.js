// Route tests for /api/consumables with an in-memory fake Prisma and image store (no database or disk needed).
process.env.JWT_SECRET = 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const db = {
  rows: [],
  nextId: 1,
  hazards: [
    { hazardId: 1, code: 'GHS02', name: 'Flammable', description: null },
    { hazardId: 2, code: 'GHS05', name: 'Corrosive', description: null },
  ],
  links: [], // haz_con rows: { consumableId, hazardId }
  usedByOthers: new Set(), // consumables a lab session or order points to
};
const deletedImages = [];
const prismaError = (code) => Object.assign(new Error(code), { code });
const find = (id) => db.rows.find((r) => r.consumableId === id);
const hazardsOf = (id) => db.links.filter((l) => l.consumableId === id).map((l) => ({ hazard: db.hazards.find((h) => h.hazardId === l.hazardId) }));
const hazardIdsOf = (id) => db.links.filter((l) => l.consumableId === id).map((l) => l.hazardId).sort();

const fakePrisma = {
  $transaction: async (fn) => fn(fakePrisma),
  consumable: {
    findMany: async ({ where }) =>
      db.rows
        .filter((r) => !where || r.name.includes(where.name.contains))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ ...r, hazards: hazardsOf(r.consumableId) })),
    // a copy, like real Prisma, so a later update doesn't change what was read before
    findUnique: async ({ where }) => {
      const row = find(where.consumableId);
      return row ? { ...row } : null;
    },
    create: async ({ data: { hazards, ...data } }) => {
      const row = { consumableId: db.nextId++, ...data };
      db.rows.push(row);
      for (const { hazardId } of hazards?.create ?? []) db.links.push({ consumableId: row.consumableId, hazardId });
      return row;
    },
    update: async ({ where, data }) => {
      const row = find(where.consumableId);
      if (!row) throw prismaError('P2025');
      return Object.assign(row, data);
    },
    delete: async ({ where }) => {
      const row = find(where.consumableId);
      if (!row) throw prismaError('P2025');
      if (db.links.some((l) => l.consumableId === row.consumableId) || db.usedByOthers.has(row.consumableId)) {
        throw prismaError('P2003');
      }
      db.rows = db.rows.filter((r) => r !== row);
      return row;
    },
  },
  hazard: {
    findMany: async () => db.hazards,
    count: async ({ where }) => db.hazards.filter((h) => where.hazardId.in.includes(h.hazardId)).length,
  },
  hazCon: {
    deleteMany: async ({ where }) => {
      db.links = db.links.filter((l) => l.consumableId !== where.consumableId);
    },
    createMany: async ({ data }) => {
      db.links.push(...data);
    },
  },
};

function stubModule(relPath, exports) {
  const file = require.resolve(relPath);
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
}
stubModule('../lib/prisma', { prisma: fakePrisma });
stubModule('../utils/saveConsumableImage', {
  saveConsumableImage: (id) => `/consumableImages/${id}/photo.png`,
  deleteConsumableImage: (id) => deletedImages.push(id),
});

const consumableRoutes = require('../routes/consumableRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/consumables', consumableRoutes);
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

let server, base;
test.before(async () => {
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const manager = `token=${jwt.sign({ userId: 1, role: 'lab_manager' }, process.env.JWT_SECRET)}`;
const member = `token=${jwt.sign({ userId: 2, role: 'member' }, process.env.JWT_SECRET)}`;
const call = (method, url, { as = manager, body } = {}) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(as ? { Cookie: as } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

test('401 without login, 403 for a member who tries to change anything', async () => {
  assert.equal((await call('GET', '/api/consumables', { as: null })).status, 401);
  assert.equal((await call('POST', '/api/consumables', { as: member, body: { name: 'X', unit: 'ml' } })).status, 403);
});

test('POST 400 lists every invalid field and saves nothing', async () => {
  const before = db.rows.length;
  const res = await call('POST', '/api/consumables', { body: { name: 'Ethanol', currentStock: -5, phValue: 20 } });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error, 'Validation failed');
  assert.deepEqual(Object.keys(json.details).sort(), ['currentStock', 'phValue', 'unit']);
  assert.equal(db.rows.length, before);
});

test('PUT 400 on an invalid field, item unchanged', async () => {
  const { consumableId } = await (await call('POST', '/api/consumables', { body: { name: 'KCl', unit: 'g', currentStock: 10 } })).json();
  const res = await call('PUT', `/api/consumables/${consumableId}`, { body: { currentStock: -1 } });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).details.currentStock);
  assert.equal(find(consumableId).currentStock, 10);
});

test('PUT keeps working for an old item with a free-text unit', async () => {
  db.rows.push({ consumableId: db.nextId, name: 'Old reagent', unit: 'bottle', currentStock: 2, reorderThreshold: 1 });
  const consumableId = db.nextId++;
  const res = await call('PUT', `/api/consumables/${consumableId}`, { body: { unit: 'bottle', currentStock: 3 } });
  assert.equal(res.status, 200);
  assert.equal(find(consumableId).currentStock, 3);
});

test('POST 201 fills defaults for the optional fields', async () => {
  const res = await call('POST', '/api/consumables', { body: { name: 'Agar', unit: 'g', expiryDate: '2027-03-15' } });
  assert.equal(res.status, 201);
  const saved = find((await res.json()).consumableId);
  assert.equal(saved.currentStock, 0);
  assert.equal(saved.reorderThreshold, 0);
  assert.equal(saved.description, null);
  assert.equal(saved.phValue, null);
  assert.equal(saved.imageUrl, null);
  assert.ok(saved.expiryDate instanceof Date);
});

test('GET returns Decimal columns as numbers, sorted by name', async () => {
  db.rows.push({ consumableId: db.nextId++, name: 'Buffer', unit: 'ml', currentStock: '12.50', reorderThreshold: '5', phValue: '7.40' });
  const rows = await (await call('GET', '/api/consumables', { as: member })).json();
  const buffer = rows.find((r) => r.name === 'Buffer');
  assert.deepEqual([buffer.currentStock, buffer.reorderThreshold, buffer.phValue], [12.5, 5, 7.4]);
  assert.deepEqual(rows.map((r) => r.name), [...rows.map((r) => r.name)].sort());
});

test('PUT only changes the fields that were sent', async () => {
  const { consumableId } = await (await call('POST', '/api/consumables', { body: { name: 'NaCl', unit: 'g', currentStock: 100 } })).json();
  const res = await call('PUT', `/api/consumables/${consumableId}`, { body: { currentStock: 80 } });
  assert.equal(res.status, 200);
  assert.equal(find(consumableId).currentStock, 80);
  assert.equal(find(consumableId).name, 'NaCl');
});

test('PUT removes the uploaded photo when imageUrl changes, but not when it is left out', async () => {
  const { consumableId } = await (await call('POST', '/api/consumables', { body: { name: 'Gloves', unit: 'pieces' } })).json();
  find(consumableId).imageUrl = '/consumableImages/x/photo.png';

  await call('PUT', `/api/consumables/${consumableId}`, { body: { name: 'Gloves M' } });
  assert.ok(!deletedImages.includes(consumableId));

  await call('PUT', `/api/consumables/${consumableId}`, { body: { imageUrl: 'https://example.com/g.png' } });
  assert.ok(deletedImages.includes(consumableId));
});

test('400 on a bad id and 404 on a missing item, for every :id route', async () => {
  for (const [method, path] of [['PUT', ''], ['DELETE', ''], ['DELETE', '/image']]) {
    assert.equal((await call(method, `/api/consumables/abc${path}`, { body: {} })).status, 400);
    assert.equal((await call(method, `/api/consumables/999${path}`, { body: {} })).status, 404);
  }
});

test('DELETE 204 removes the item and its photo', async () => {
  const { consumableId } = await (await call('POST', '/api/consumables', { body: { name: 'Tips', unit: 'pieces' } })).json();
  assert.equal((await call('DELETE', `/api/consumables/${consumableId}`)).status, 204);
  assert.equal(find(consumableId), undefined);
  assert.ok(deletedImages.includes(consumableId));
});

test('PUT /:id/image stores the photo URL; DELETE /:id/image clears it', async () => {
  const { consumableId } = await (await call('POST', '/api/consumables', { body: { name: 'HCl', unit: 'ml' } })).json();
  const upload = await fetch(`${base}/api/consumables/${consumableId}/image`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png', Cookie: manager },
    body: Buffer.from([1, 2, 3]),
  });
  assert.equal(upload.status, 200);
  assert.equal(find(consumableId).imageUrl, `/consumableImages/${consumableId}/photo.png`);

  assert.equal((await call('DELETE', `/api/consumables/${consumableId}/image`)).status, 200);
  assert.equal(find(consumableId).imageUrl, null);
});

test('GET /hazards lists the hazards that can be chosen', async () => {
  const hazards = await (await call('GET', '/api/consumables/hazards', { as: member })).json();
  assert.deepEqual(hazards.map((h) => h.code), ['GHS02', 'GHS05']);
});

test('POST saves the chosen hazards and GET returns them as a plain list', async () => {
  const res = await call('POST', '/api/consumables', { body: { name: 'Methanol', unit: 'l', hazardIds: [1, 2] } });
  assert.equal(res.status, 201);
  const { consumableId } = await res.json();
  assert.deepEqual(hazardIdsOf(consumableId), [1, 2]);

  const rows = await (await call('GET', '/api/consumables', { as: member })).json();
  assert.deepEqual(rows.find((r) => r.consumableId === consumableId).hazards.map((h) => h.code), ['GHS02', 'GHS05']);
});

test('POST/PUT 400 when a hazard id does not exist', async () => {
  const res = await call('POST', '/api/consumables', { body: { name: 'X', unit: 'ml', hazardIds: [99] } });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).details.hazardIds);
});

test('PUT replaces the hazard list when hazardIds is sent, keeps it otherwise', async () => {
  const { consumableId } = await (await call('POST', '/api/consumables', { body: { name: 'HCl 1M', unit: 'ml', hazardIds: [2] } })).json();

  await call('PUT', `/api/consumables/${consumableId}`, { body: { currentStock: 5 } });
  assert.deepEqual(hazardIdsOf(consumableId), [2]);

  await call('PUT', `/api/consumables/${consumableId}`, { body: { hazardIds: [1] } });
  assert.deepEqual(hazardIdsOf(consumableId), [1]);

  await call('PUT', `/api/consumables/${consumableId}`, { body: { hazardIds: [] } });
  assert.deepEqual(hazardIdsOf(consumableId), []);
});

test('DELETE removes hazard links first; 409 when a lab session or order still uses the item', async () => {
  const { consumableId } = await (await call('POST', '/api/consumables', { body: { name: 'Acetone', unit: 'l', hazardIds: [1] } })).json();
  assert.equal((await call('DELETE', `/api/consumables/${consumableId}`)).status, 204);
  assert.deepEqual(hazardIdsOf(consumableId), []);

  const used = await (await call('POST', '/api/consumables', { body: { name: 'Agarose', unit: 'g' } })).json();
  db.usedByOthers.add(used.consumableId);
  assert.equal((await call('DELETE', `/api/consumables/${used.consumableId}`)).status, 409);
  assert.ok(find(used.consumableId));
});
