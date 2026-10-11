// Route tests with an in-memory fake Prisma (no database needed).
process.env.JWT_SECRET = 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// ---- fake prisma, injected before the routes are loaded ----
const db = { requests: [], history: [], equipment: [{ equipmentId: 1 }], nextId: 1 };
const user = (id) => ({ userId: id, firstName: 'U' + id, lastName: 'X', email: `u${id}@x.com` });

const fakePrisma = {
  equipment: {
    findUnique: async ({ where }) => db.equipment.find((e) => e.equipmentId === where.equipmentId) ?? null,
  },
  $transaction: async (fn) => fn(fakePrisma),
  request: {
    create: async ({ data }) => {
      const row = {
        requestId: db.nextId++,
        ...data,
        accessDetail: data.accessDetail?.create ?? null,
        status: 'open',
        createdAt: new Date(),
        requester: user(data.requesterId),
        statusHistory: [],
      };
      db.requests.push(row);
      return row;
    },
    findMany: async ({ where }) =>
      db.requests.filter((r) => (!where.requesterId || r.requesterId === where.requesterId) &&
        (!where.status || r.status === where.status) && (!where.type || r.type === where.type)),
    count: async ({ where }) =>
      db.requests.filter((r) => !where.requesterId || r.requesterId === where.requesterId).length,
    findUnique: async ({ where }) => db.requests.find((r) => r.requestId === where.requestId) ?? null,
  },
  requestStatusHistory: { create: async ({ data }) => db.history.push(data) },
};
require.cache[require.resolve('../lib/prisma')] = {
  id: require.resolve('../lib/prisma'),
  filename: require.resolve('../lib/prisma'),
  loaded: true,
  exports: { prisma: fakePrisma },
};

const requestRoutes = require('../routes/requestRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/requests', requestRoutes);

let server, base;
test.before(async () => {
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const cookie = (userId, role = 'member') =>
  `token=${jwt.sign({ userId, role }, process.env.JWT_SECRET)}`;
const call = (method, url, { as, body } = {}) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(as ? { Cookie: as } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

const good = { type: 'maintenance', title: 'Microscope broken', description: 'Lens is cracked', equipmentId: 1 };

test('401 without login', async () => {
  assert.equal((await call('POST', '/api/requests', { body: good })).status, 401);
  assert.equal((await call('GET', '/api/requests')).status, 401);
});

test('POST 400 on invalid input, nothing saved', async () => {
  const before = db.requests.length;
  const res = await call('POST', '/api/requests', { as: cookie(1), body: { type: 'ticket', title: '' } });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.ok(json.details.title && json.details.description);
  assert.equal(db.requests.length, before);
});

test('POST 400 when equipment does not exist', async () => {
  const res = await call('POST', '/api/requests', { as: cookie(1), body: { ...good, equipmentId: 999 } });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).details.equipmentId);
});

test('POST 201 saves request owned by the logged-in user + writes status history', async () => {
  const res = await call('POST', '/api/requests', { as: cookie(1), body: { ...good, requesterId: 99 } });
  assert.equal(res.status, 201);
  const { request } = await res.json();
  assert.equal(request.requesterId, 1); // body requesterId must be ignored
  assert.equal(request.status, 'open');
  assert.deepEqual(db.history.at(-1), { requestId: request.requestId, oldStatus: null, newStatus: 'open', changedBy: 1 });
});

test('access_permission creates its detail row', async () => {
  const res = await call('POST', '/api/requests', {
    as: cookie(1),
    body: { type: 'access_permission', title: 'Need lab room', description: 'Thesis work', resourceType: 'room' },
  });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).request.accessDetail.resourceType, 'room');
});

test('member sees only own requests, staff sees all', async () => {
  await call('POST', '/api/requests', { as: cookie(2), body: good });
  const mine = await (await call('GET', '/api/requests', { as: cookie(2) })).json();
  assert.ok(mine.items.every((r) => r.requesterId === 2));
  const all = await (await call('GET', '/api/requests', { as: cookie(3, 'lab_manager') })).json();
  assert.equal(all.total, db.requests.length);
});

test('GET /:id — owner ok, other member 403, staff ok, unknown 404, bad id 400', async () => {
  const id = db.requests.find((r) => r.requesterId === 1).requestId;
  assert.equal((await call('GET', `/api/requests/${id}`, { as: cookie(1) })).status, 200);
  assert.equal((await call('GET', `/api/requests/${id}`, { as: cookie(2) })).status, 403);
  assert.equal((await call('GET', `/api/requests/${id}`, { as: cookie(3, 'ta') })).status, 200);
  assert.equal((await call('GET', '/api/requests/9999', { as: cookie(1) })).status, 404);
  assert.equal((await call('GET', '/api/requests/abc', { as: cookie(1) })).status, 400);
});

test('GET rejects invalid filters', async () => {
  assert.equal((await call('GET', '/api/requests?status=nope', { as: cookie(1) })).status, 400);
  assert.equal((await call('GET', '/api/requests?type=nope', { as: cookie(1) })).status, 400);
});
