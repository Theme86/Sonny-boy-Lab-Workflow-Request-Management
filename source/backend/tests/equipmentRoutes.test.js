// Route tests for /api/equipment with an in-memory fake Prisma (no database needed).
// Run: npm test   (or: node --test tests/equipmentRoutes.test.js)
process.env.JWT_SECRET = 'test-secret';

const { test, describe, beforeEach, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// ---------- fake database ----------
const INT_MAX = 2147483647;

let users = [];
let equipment = [];
let propEquip = []; // { equipmentId, propertyId }
const properties = [
  { propertyId: 1, name: 'Needs training' },
  { propertyId: 2, name: 'Fragile' },
  { propertyId: 3, name: 'Hazardous' },
];
let nextId = 1;
let lastFindManyArgs = null; // what the route asked Prisma for (checks sort / search)

const mkEquip = (o = {}) => ({
  equipmentId: nextId++,
  name: 'Item',
  description: null,
  quantityTotal: 10,
  quantityAvailable: 10,
  location: null,
  imageUrl: null,
  categoryId: null,
  ...o,
});

const reset = () => {
  users = [
    { userId: 1, role: 'member', active: true },
    { userId: 2, role: 'lab_manager', active: true },
    { userId: 3, role: 'ta', active: true },
    { userId: 4, role: 'lab_manager', active: false }, // disabled manager
  ];
  nextId = 1;
  equipment = [
    mkEquip({ name: 'Oscilloscope', location: 'Room 204', quantityTotal: 8, quantityAvailable: 3 }), // 1: 37% free  -> in stock
    mkEquip({ name: 'Centrifuge', location: 'Room 101', quantityTotal: 5, quantityAvailable: 5 }), //   2: all free  -> in stock
    mkEquip({ name: 'Microscope', location: 'Room 204', quantityTotal: 20, quantityAvailable: 4 }), //  3: 20% free  -> low
    mkEquip({ name: 'Pipette', location: null, quantityTotal: 10, quantityAvailable: 0 }), //           4: none free -> out
    mkEquip({ name: 'Beaker', location: 'Storage', quantityTotal: 0, quantityAvailable: 0 }), //        5: total 0   -> out
  ];
  propEquip = [{ equipmentId: 1, propertyId: 1 }];
  lastFindManyArgs = null;
};

const withProps = (e, include) =>
  include?.properties
    ? { ...e, properties: propEquip.filter((p) => p.equipmentId === e.equipmentId).map((p) => ({ ...p, property: properties.find((x) => x.propertyId === p.propertyId) })) }
    : { ...e };

const matches = (e, where = {}) => {
  if (where.quantityAvailable?.gt !== undefined && !(e.quantityAvailable > where.quantityAvailable.gt)) return false;
  if (where.OR) {
    const hit = where.OR.some((cond) => {
      const [field, { contains }] = Object.entries(cond)[0];
      return String(e[field] ?? '').toLowerCase().includes(contains.toLowerCase());
    });
    if (!hit) return false;
  }
  return true;
};

const compare = (a, b, orderBy) => {
  for (const spec of orderBy) {
    const [key, dir] = Object.entries(spec)[0];
    const x = a[key], y = b[key];
    if (x === y) continue;
    if (x === null) return dir === 'desc' ? 1 : -1; // MySQL puts NULL first when ascending
    if (y === null) return dir === 'desc' ? -1 : 1;
    const r = x < y ? -1 : 1;
    return dir === 'desc' ? -r : r;
  }
  return 0;
};

// Like a Prisma query: nothing happens until it is awaited, so $transaction([a, b]) can undo a if b fails
const lazy = (run) => ({ then: (ok, fail) => run().then(ok, fail) });

const notFound = () => Object.assign(new Error('not found'), { code: 'P2025' });

const equipmentDb = {
  findMany: async (args = {}) => {
    lastFindManyArgs = args;
    const { where, include, orderBy = [], skip = 0, take, select } = args;
    const rows = equipment.filter((e) => matches(e, where)).sort((a, b) => compare(a, b, orderBy)).slice(skip, take === undefined ? undefined : skip + take);
    if (select) return rows.map((r) => Object.fromEntries(Object.keys(select).map((k) => [k, r[k]])));
    return rows.map((r) => withProps(r, include));
  },
  count: async ({ where } = {}) => equipment.filter((e) => matches(e, where)).length,
  findUnique: async ({ where, include, select }) => {
    const row = equipment.find((e) => e.equipmentId === where.equipmentId);
    if (!row) return null;
    if (select) return Object.fromEntries(Object.keys(select).map((k) => [k, row[k]]));
    return withProps(row, include);
  },
  create: async ({ data, include }) => {
    const { properties: nested, ...fields } = data;
    for (const p of nested?.create ?? []) {
      if (!properties.some((x) => x.propertyId === p.propertyId)) throw Object.assign(new Error('fk'), { code: 'P2003' });
    }
    const row = mkEquip({ description: null, location: null, ...fields });
    equipment.push(row);
    for (const p of nested?.create ?? []) propEquip.push({ equipmentId: row.equipmentId, propertyId: p.propertyId });
    return withProps(row, include);
  },
  update: async ({ where, data, include }) => {
    const row = equipment.find((e) => e.equipmentId === where.equipmentId);
    if (!row) throw notFound();
    Object.assign(row, data);
    return withProps(row, include);
  },
  delete: ({ where }) =>
    lazy(async () => {
      const i = equipment.findIndex((e) => e.equipmentId === where.equipmentId);
      if (i < 0) throw notFound();
      if (referenced.has(where.equipmentId)) throw Object.assign(new Error('fk'), { code: 'P2003' });
      equipment.splice(i, 1);
    }),
};

let referenced = new Set(); // equipment ids that other tables still point at (ON DELETE RESTRICT)

const fakePrisma = {
  user: { findUnique: async ({ where }) => users.find((u) => u.userId === where.userId) ?? null },
  equipment: equipmentDb,
  propEquip: {
    deleteMany: ({ where }) =>
      lazy(async () => {
        propEquip = propEquip.filter((p) => p.equipmentId !== where.equipmentId);
      }),
    createMany: async ({ data }) => {
      for (const d of data) {
        if (!properties.some((p) => p.propertyId === d.propertyId)) throw Object.assign(new Error('fk'), { code: 'P2003' });
        propEquip.push({ ...d });
      }
    },
  },
  // supports both forms the route uses: $transaction([promises]) and $transaction(async (tx) => ...)
  // like the real thing, the changes are undone if anything inside throws
  $transaction: async (arg) => {
    const snapshot = { equipment: equipment.map((e) => ({ ...e })), propEquip: propEquip.map((p) => ({ ...p })) };
    try {
      if (typeof arg === 'function') return await arg(fakePrisma);
      const results = [];
      for (const query of arg) results.push(await query); // in order, like the real transaction
      return results;
    } catch (err) {
      equipment = snapshot.equipment;
      propEquip = snapshot.propEquip;
      throw err;
    }
  },
};

const stub = (modulePath, exports) => {
  const resolved = require.resolve(modulePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

stub('../lib/prisma', { prisma: fakePrisma });

// Image helpers are stubbed so tests never write to disk. The stub still uses the real file-type detection.
const realImages = require('../utils/saveUserImage');
const savedImages = [];
const deletedImages = [];
stub('../utils/saveEquipmentImage', {
  saveEquipmentImage: (equipmentId, buffer) => {
    if (!realImages.detectImageExtension(buffer)) {
      const err = new Error('Only JPG, PNG or WEBP images are allowed');
      err.status = 415;
      throw err;
    }
    savedImages.push({ equipmentId, bytes: buffer.length });
    return `/equipmentImages/${equipmentId}/photo.png?v=1`;
  },
  deleteEquipmentImage: (equipmentId) => deletedImages.push(equipmentId),
});

const equipmentRoutes = require('../routes/equipmentRoutes');

// ---------- test server (same error format as index.js) ----------
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/equipment', equipmentRoutes);
app.use((err, _req, res, _next) => res.status(err.status || err.statusCode || 500).json({ error: err.message }));

let server, base;
before(async () => {
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => {
  reset();
  referenced = new Set();
  savedImages.length = 0;
  deletedImages.length = 0;
});

// the role in the cookie is only what the token claims; the server must use the database value
const as = (id, claimedRole) => `token=${jwt.sign({ userId: id, role: claimedRole ?? users.find((u) => u.userId === id)?.role }, process.env.JWT_SECRET)}`;
const MEMBER = () => as(1);
const MANAGER = () => as(2);

const call = (method, url, { who, body, raw, contentType } = {}) =>
  fetch(base + url, {
    method,
    headers: {
      ...(raw !== undefined ? { 'Content-Type': contentType ?? 'image/png' } : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(who ? { Cookie: who } : {}),
    },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(8)]);
const names = (json) => json.items.map((i) => i.name);

// ================= who may do what =================
describe('permissions', () => {
  test('401 without a login cookie, on every route', async () => {
    for (const [m, u] of [
      ['GET', '/api/equipment'], ['GET', '/api/equipment/summary'], ['GET', '/api/equipment/1'],
      ['POST', '/api/equipment'], ['PATCH', '/api/equipment/1'], ['DELETE', '/api/equipment/1'],
      ['PUT', '/api/equipment/1/image'], ['DELETE', '/api/equipment/1/image'],
    ]) {
      assert.equal((await call(m, u)).status, 401, `${m} ${u}`);
    }
  });

  test('any logged-in user can read (member, ta, lab_manager)', async () => {
    for (const id of [1, 2, 3]) {
      assert.equal((await call('GET', '/api/equipment', { who: as(id) })).status, 200);
      assert.equal((await call('GET', '/api/equipment/1', { who: as(id) })).status, 200);
      assert.equal((await call('GET', '/api/equipment/summary', { who: as(id) })).status, 200);
    }
  });

  test('a member or ta gets 403 on every write route, and nothing changes', async () => {
    for (const id of [1, 3]) {
      const who = as(id);
      assert.equal((await call('POST', '/api/equipment', { who, body: { name: 'X' } })).status, 403);
      assert.equal((await call('PATCH', '/api/equipment/1', { who, body: { name: 'X' } })).status, 403);
      assert.equal((await call('DELETE', '/api/equipment/1', { who })).status, 403);
      assert.equal((await call('PUT', '/api/equipment/1/image', { who, raw: PNG })).status, 403);
      assert.equal((await call('DELETE', '/api/equipment/1/image', { who })).status, 403);
    }
    assert.equal(equipment.length, 5);
    assert.equal(equipment[0].name, 'Oscilloscope');
    assert.equal(savedImages.length, 0);
  });

  test('a token that CLAIMS lab_manager does not help a member: the role comes from the database', async () => {
    const res = await call('POST', '/api/equipment', { who: as(1, 'lab_manager'), body: { name: 'Sneaky' } });
    assert.equal(res.status, 403);
    assert.equal(equipment.length, 5);
  });

  test('a demoted manager loses access at once, even with an old token', async () => {
    const oldToken = as(2); // token says lab_manager
    users.find((u) => u.userId === 2).role = 'member';
    assert.equal((await call('POST', '/api/equipment', { who: oldToken, body: { name: 'X' } })).status, 403);
  });

  test('a disabled manager gets 403 and a deleted account gets 401', async () => {
    assert.equal((await call('POST', '/api/equipment', { who: as(4, 'lab_manager'), body: { name: 'X' } })).status, 403);
    assert.equal((await call('POST', '/api/equipment', { who: as(999, 'lab_manager'), body: { name: 'X' } })).status, 401);
  });
});

// ================= list =================
describe('GET /api/equipment (list)', () => {
  test('returns items with the properties flattened, plus page, limit and total', async () => {
    const res = await call('GET', '/api/equipment', { who: MEMBER() });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.total, 5);
    assert.equal(json.page, 1);
    assert.equal(json.limit, 20);
    const osc = json.items.find((i) => i.name === 'Oscilloscope');
    assert.deepEqual(osc.properties, [{ propertyId: 1, name: 'Needs training' }]);
    assert.equal('categoryId' in osc, false);
  });

  test('default order is name A to Z', async () => {
    const json = await (await call('GET', '/api/equipment', { who: MEMBER() })).json();
    assert.deepEqual(names(json), ['Beaker', 'Centrifuge', 'Microscope', 'Oscilloscope', 'Pipette']);
  });

  test('q searches the name', async () => {
    const json = await (await call('GET', '/api/equipment?q=scope', { who: MEMBER() })).json();
    assert.deepEqual(names(json), ['Microscope', 'Oscilloscope']);
  });

  test('q also searches the location, and the total counts the matches only', async () => {
    const json = await (await call('GET', '/api/equipment?q=Room 204', { who: MEMBER() })).json();
    assert.deepEqual(names(json), ['Microscope', 'Oscilloscope']);
    assert.equal(json.total, 2);
  });

  test('available=true hides items with none free', async () => {
    const json = await (await call('GET', '/api/equipment?available=true', { who: MEMBER() })).json();
    assert.deepEqual(names(json), ['Centrifuge', 'Microscope', 'Oscilloscope']);
  });

  test('q and available=true work together', async () => {
    const json = await (await call('GET', '/api/equipment?q=Room&available=true', { who: MEMBER() })).json();
    assert.deepEqual(names(json), ['Centrifuge', 'Microscope', 'Oscilloscope']);
  });

  const sorted = async (sort) => names(await (await call('GET', `/api/equipment?sort=${sort}`, { who: MEMBER() })).json());

  test('sort=name_desc is Z to A', async () => {
    assert.deepEqual(await sorted('name_desc'), ['Pipette', 'Oscilloscope', 'Microscope', 'Centrifuge', 'Beaker']);
  });

  test('sort=available_low puts the fewest free first (ties by name)', async () => {
    // free: Beaker 0, Pipette 0, Microscope 4, Oscilloscope 3, Centrifuge 5
    assert.deepEqual(await sorted('available_low'), ['Beaker', 'Pipette', 'Oscilloscope', 'Microscope', 'Centrifuge']);
  });

  test('sort=available_high puts the most free first (ties by name)', async () => {
    assert.deepEqual(await sorted('available_high'), ['Centrifuge', 'Microscope', 'Oscilloscope', 'Beaker', 'Pipette']);
  });

  test('sort=location is by location, then name', async () => {
    // Pipette has no location (NULL sorts first), then Room 101, Room 204 x2, Storage
    assert.deepEqual(await sorted('location'), ['Pipette', 'Centrifuge', 'Microscope', 'Oscilloscope', 'Beaker']);
  });

  test('an unknown sort falls back to name, and it can never reach Prisma as a field name', async () => {
    for (const bad of ['banana', 'constructor', '__proto__', 'toString', 'quantityTotal', '']) {
      const json = await (await call('GET', `/api/equipment?sort=${bad}`, { who: MEMBER() })).json();
      assert.deepEqual(names(json), ['Beaker', 'Centrifuge', 'Microscope', 'Oscilloscope', 'Pipette'], `sort=${bad}`);
      assert.deepEqual(lastFindManyArgs.orderBy, [{ name: 'asc' }], `sort=${bad}`);
    }
  });

  test('paging: limit and page slice the list, and total stays the full count', async () => {
    const p1 = await (await call('GET', '/api/equipment?limit=2&page=1', { who: MEMBER() })).json();
    const p2 = await (await call('GET', '/api/equipment?limit=2&page=2', { who: MEMBER() })).json();
    const p3 = await (await call('GET', '/api/equipment?limit=2&page=3', { who: MEMBER() })).json();
    assert.deepEqual(names(p1), ['Beaker', 'Centrifuge']);
    assert.deepEqual(names(p2), ['Microscope', 'Oscilloscope']);
    assert.deepEqual(names(p3), ['Pipette']);
    assert.equal(p1.total, 5);
    assert.equal(p3.total, 5);
  });

  test('bad page / limit values fall back to the defaults; limit is capped at 100', async () => {
    for (const q of ['page=abc', 'page=0', 'page=-2', 'page=1.5']) {
      assert.equal((await (await call('GET', `/api/equipment?${q}`, { who: MEMBER() })).json()).page, 1, q);
    }
    for (const q of ['limit=abc', 'limit=0', 'limit=-5', 'limit=2.5']) {
      assert.equal((await (await call('GET', `/api/equipment?${q}`, { who: MEMBER() })).json()).limit, 20, q);
    }
    assert.equal((await (await call('GET', '/api/equipment?limit=5000', { who: MEMBER() })).json()).limit, 100);
  });
});

// ================= summary cards =================
describe('GET /api/equipment/summary', () => {
  test('counts total, inStock, low and out (out = none free, low = 25% or less free)', async () => {
    const res = await call('GET', '/api/equipment/summary', { who: MEMBER() });
    assert.equal(res.status, 200);
    // Oscilloscope 3/8 in, Centrifuge 5/5 in, Microscope 4/20 low, Pipette 0/10 out, Beaker 0/0 out
    assert.deepEqual(await res.json(), { total: 5, inStock: 2, low: 1, out: 2 });
  });

  test('exactly 25% free counts as low, just above it counts as in stock', async () => {
    equipment = [mkEquip({ quantityTotal: 8, quantityAvailable: 2 }), mkEquip({ quantityTotal: 8, quantityAvailable: 3 })];
    assert.deepEqual(await (await call('GET', '/api/equipment/summary', { who: MEMBER() })).json(), { total: 2, inStock: 1, low: 1, out: 0 });
  });

  test('works with an empty table', async () => {
    equipment = [];
    assert.deepEqual(await (await call('GET', '/api/equipment/summary', { who: MEMBER() })).json(), { total: 0, inStock: 0, low: 0, out: 0 });
  });

  test('is not mistaken for an id (GET /:id would answer 400)', async () => {
    assert.equal((await call('GET', '/api/equipment/summary', { who: MEMBER() })).status, 200);
  });
});

// ================= read one =================
describe('GET /api/equipment/:id', () => {
  test('returns one item with its properties', async () => {
    const res = await call('GET', '/api/equipment/1', { who: MEMBER() });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.name, 'Oscilloscope');
    assert.deepEqual(json.properties, [{ propertyId: 1, name: 'Needs training' }]);
  });

  test('404 for an id that does not exist', async () => {
    assert.equal((await call('GET', '/api/equipment/999', { who: MEMBER() })).status, 404);
  });

  test('400 for ids that are not positive whole numbers', async () => {
    for (const id of ['abc', '0', '-1', '1.5']) {
      assert.equal((await call('GET', `/api/equipment/${id}`, { who: MEMBER() })).status, 400, id);
    }
  });
});

// ================= create =================
describe('POST /api/equipment', () => {
  test('a manager can create; the response is 201 and the row is saved', async () => {
    const res = await call('POST', '/api/equipment', {
      who: MANAGER(),
      body: { name: '  Hot plate  ', description: 'Heats', location: 'Room 1', quantityTotal: 4, quantityAvailable: 3 },
    });
    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.name, 'Hot plate'); // trimmed
    assert.equal(json.quantityAvailable, 3);
    assert.equal(equipment.length, 6);
  });

  test('available defaults to the total, and the total defaults to 0', async () => {
    const a = await (await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'A', quantityTotal: 7 } })).json();
    assert.equal(a.quantityAvailable, 7);
    const b = await (await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'B' } })).json();
    assert.deepEqual([b.quantityTotal, b.quantityAvailable], [0, 0]);
  });

  test('links the chosen properties (duplicates are ignored)', async () => {
    const json = await (await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'P', propertyIds: [1, 2, 2] } })).json();
    assert.deepEqual(json.properties.map((p) => p.propertyId).sort(), [1, 2]);
  });

  test('400 when the name is missing, empty, blank, not a string or too long', async () => {
    for (const name of [undefined, '', '   ', 123, 'x'.repeat(151)]) {
      assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name } })).status, 400, String(name));
    }
    assert.equal((await call('POST', '/api/equipment', { who: MANAGER() })).status, 400); // no body at all
    assert.equal(equipment.length, 5);
  });

  test('a name of exactly 150 characters is allowed', async () => {
    assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'x'.repeat(150) } })).status, 201);
  });

  test('400 for bad quantities: negative, decimal, text, null, too large', async () => {
    for (const quantityTotal of [-1, 1.5, '5', null, INT_MAX + 1]) {
      assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', quantityTotal } })).status, 400, `total ${quantityTotal}`);
    }
    for (const quantityAvailable of [-1, 1.5, '5', null, INT_MAX + 1]) {
      assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', quantityTotal: 5, quantityAvailable } })).status, 400, `available ${quantityAvailable}`);
    }
    assert.equal(equipment.length, 5);
  });

  test('the largest MySQL INT is accepted, one more is not', async () => {
    assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'Max', quantityTotal: INT_MAX } })).status, 201);
    assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'Over', quantityTotal: INT_MAX + 1 } })).status, 400);
  });

  test('400 when available is more than the total', async () => {
    const res = await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', quantityTotal: 3, quantityAvailable: 4 } });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /cannot exceed/);
  });

  test('400 for a description over 250 or a location over 100 characters', async () => {
    assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', description: 'd'.repeat(251) } })).status, 400);
    assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', location: 'l'.repeat(101) } })).status, 400);
    assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', description: 'd'.repeat(250), location: 'l'.repeat(100) } })).status, 201);
  });

  test('400 when propertyIds is not an array of positive whole numbers', async () => {
    for (const propertyIds of ['1', [0], [-1], [1.5], ['a'], [1, null]]) {
      assert.equal((await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', propertyIds } })).status, 400, JSON.stringify(propertyIds));
    }
  });

  test('409 when a propertyId does not exist, and nothing is saved', async () => {
    const res = await call('POST', '/api/equipment', { who: MANAGER(), body: { name: 'X', propertyIds: [999] } });
    assert.equal(res.status, 409);
    assert.equal(equipment.length, 5);
  });

  test('mass assignment: imageUrl, equipmentId and unknown fields in the body are ignored', async () => {
    const res = await call('POST', '/api/equipment', {
      who: MANAGER(),
      body: { name: 'Safe', imageUrl: 'https://evil.example/x.png', equipmentId: 777, categoryId: 5, isAdmin: true },
    });
    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.imageUrl, null);
    assert.notEqual(json.equipmentId, 777);
    assert.equal('isAdmin' in json, false);
  });
});

// ================= update =================
describe('PATCH /api/equipment/:id', () => {
  test('changes only the fields that are sent', async () => {
    const res = await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { location: 'Room 999' } });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.location, 'Room 999');
    assert.equal(json.name, 'Oscilloscope');
    assert.equal(json.quantityTotal, 8);
  });

  test('null clears the description and the location', async () => {
    const json = await (await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { description: null, location: null } })).json();
    assert.equal(json.description, null);
    assert.equal(json.location, null);
  });

  test('propertyIds REPLACES the whole list; [] removes all; leaving it out keeps them', async () => {
    let json = await (await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { propertyIds: [2, 3] } })).json();
    assert.deepEqual(json.properties.map((p) => p.propertyId).sort(), [2, 3]);

    json = await (await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { name: 'Renamed' } })).json();
    assert.deepEqual(json.properties.map((p) => p.propertyId).sort(), [2, 3]);

    json = await (await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { propertyIds: [] } })).json();
    assert.deepEqual(json.properties, []);
  });

  test('a bad propertyId (409) leaves the old property list untouched', async () => {
    const res = await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { propertyIds: [2, 999] } });
    assert.equal(res.status, 409);
    assert.deepEqual(propEquip.filter((p) => p.equipmentId === 1), [{ equipmentId: 1, propertyId: 1 }]);
  });

  test('the available <= total rule uses the merged values', async () => {
    // Oscilloscope: total 8, available 3
    assert.equal((await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { quantityTotal: 2 } })).status, 400); // 3 > 2
    assert.equal((await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { quantityAvailable: 9 } })).status, 400); // 9 > 8
    assert.equal((await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { quantityTotal: 2, quantityAvailable: 2 } })).status, 200);
    assert.equal(equipment[0].quantityTotal, 2);
  });

  test('a rejected update changes nothing', async () => {
    await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { name: 'Changed', quantityTotal: 1 } });
    assert.equal(equipment[0].name, 'Oscilloscope');
    assert.equal(equipment[0].quantityTotal, 8);
  });

  test('400 for an empty name, bad quantity, or bad id; 404 for a missing item', async () => {
    assert.equal((await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { name: '  ' } })).status, 400);
    assert.equal((await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { quantityTotal: -4 } })).status, 400);
    assert.equal((await call('PATCH', '/api/equipment/abc', { who: MANAGER(), body: { name: 'X' } })).status, 400);
    assert.equal((await call('PATCH', '/api/equipment/999', { who: MANAGER(), body: { name: 'X' } })).status, 404);
  });

  test('imageUrl cannot be set through PATCH (only through the photo routes)', async () => {
    const json = await (await call('PATCH', '/api/equipment/1', { who: MANAGER(), body: { imageUrl: 'https://evil.example/x.png' } })).json();
    assert.equal(json.imageUrl, null);
  });
});

// ================= delete =================
describe('DELETE /api/equipment/:id', () => {
  test('deletes the item, its property links and its photo file (204)', async () => {
    const res = await call('DELETE', '/api/equipment/1', { who: MANAGER() });
    assert.equal(res.status, 204);
    assert.equal(equipment.some((e) => e.equipmentId === 1), false);
    assert.equal(propEquip.some((p) => p.equipmentId === 1), false);
    assert.deepEqual(deletedImages, [1]);
  });

  test('404 for a missing item, 400 for a bad id', async () => {
    assert.equal((await call('DELETE', '/api/equipment/999', { who: MANAGER() })).status, 404);
    assert.equal((await call('DELETE', '/api/equipment/abc', { who: MANAGER() })).status, 400);
    assert.deepEqual(deletedImages, []);
  });

  test('409 when other data still uses the item; nothing is removed, not even the property links or the photo', async () => {
    referenced.add(1);
    const res = await call('DELETE', '/api/equipment/1', { who: MANAGER() });
    assert.equal(res.status, 409);
    assert.equal(equipment.some((e) => e.equipmentId === 1), true);
    assert.equal(propEquip.some((p) => p.equipmentId === 1), true);
    assert.deepEqual(deletedImages, []);
  });
});

// ================= photo =================
describe('photo routes', () => {
  test('PUT stores a PNG and saves its url on the item', async () => {
    const res = await call('PUT', '/api/equipment/2/image', { who: MANAGER(), raw: PNG });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.imageUrl, '/equipmentImages/2/photo.png?v=1');
    assert.deepEqual(savedImages, [{ equipmentId: 2, bytes: PNG.length }]);
    assert.equal(equipment[1].imageUrl, '/equipmentImages/2/photo.png?v=1');
  });

  test('PUT with a file that is not really an image (labelled image/png) gets 415', async () => {
    const res = await call('PUT', '/api/equipment/2/image', { who: MANAGER(), raw: Buffer.from('<html>not an image</html>') });
    assert.equal(res.status, 415);
    assert.equal(equipment[1].imageUrl, null);
  });

  test('PUT with the wrong Content-Type or an empty body gets 400', async () => {
    assert.equal((await call('PUT', '/api/equipment/2/image', { who: MANAGER(), raw: PNG, contentType: 'text/plain' })).status, 400);
    assert.equal((await call('PUT', '/api/equipment/2/image', { who: MANAGER(), raw: Buffer.alloc(0) })).status, 400);
    assert.equal(savedImages.length, 0);
  });

  test('PUT over 5 MB gets 413', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    assert.equal((await call('PUT', '/api/equipment/2/image', { who: MANAGER(), raw: big })).status, 413);
    assert.equal(savedImages.length, 0);
  });

  test('PUT for a missing item gets 404 and no file is written; a bad id gets 400', async () => {
    assert.equal((await call('PUT', '/api/equipment/999/image', { who: MANAGER(), raw: PNG })).status, 404);
    assert.equal((await call('PUT', '/api/equipment/abc/image', { who: MANAGER(), raw: PNG })).status, 400);
    assert.equal(savedImages.length, 0);
  });

  test('DELETE removes the photo url and the file', async () => {
    equipment[0].imageUrl = '/equipmentImages/1/photo.png?v=1';
    const res = await call('DELETE', '/api/equipment/1/image', { who: MANAGER() });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).imageUrl, null);
    assert.deepEqual(deletedImages, [1]);
  });

  test('DELETE photo for a missing item gets 404', async () => {
    assert.equal((await call('DELETE', '/api/equipment/999/image', { who: MANAGER() })).status, 404);
    assert.deepEqual(deletedImages, []);
  });
});