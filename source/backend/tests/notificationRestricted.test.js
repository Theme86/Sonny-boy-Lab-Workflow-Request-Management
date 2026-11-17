// A restricted request's title must not leak through POST /api/notifications (SRS-16).
process.env.JWT_SECRET = 'test-secret';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const roles = { 2: 'lecturer', 3: 'lab_manager', 4: 'ta', 6: 'lecturer' };
const restricted = { requestId: 1, requesterId: 2, assignedTo: 4, industryDetail: { confidentiality: 'restricted' } };
const normal = { requestId: 2, requesterId: 2, assignedTo: null, industryDetail: null };
const created = [];
const fakePrisma = {
  user: { findUnique: async ({ where }) => (roles[where.userId] ? { userId: where.userId, role: roles[where.userId], active: true } : null) },
  request: { findUnique: async ({ where }) => [restricted, normal].find((r) => r.requestId === where.requestId) ?? null },
  notification: { create: async ({ data }) => { created.push(data); return { ...data, notificationId: created.length }; } },
};
require.cache[require.resolve('../lib/prisma')] = {
  id: require.resolve('../lib/prisma'), filename: require.resolve('../lib/prisma'), loaded: true, exports: { prisma: fakePrisma },
};
const routes = require('../routes/notificationRoutes');
const { requireAuth } = require('../middleware/auth');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/notifications', requireAuth, routes);
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

let server, base;
test.before(async () => { await new Promise((r) => (server = app.listen(0, r))); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());
const post = (as, body) => fetch(base + '/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: `token=${jwt.sign({ userId: as, role: roles[as] }, process.env.JWT_SECRET)}` },
  body: JSON.stringify({ message: 'hi', notifType: 'reminder', ...body }),
});

test('another lecturer cannot create a notification about a restricted request (403)', async () => {
  const res = await post(6, { userId: 6, requestId: 1 });
  assert.equal(res.status, 403);
  assert.equal(created.length, 0);
});

test('lab manager may notify the assigned TA, but not a person who cannot see it', async () => {
  assert.equal((await post(3, { userId: 4, requestId: 1 })).status, 201);
  assert.equal((await post(3, { userId: 6, requestId: 1 })).status, 403);
});

test('non-restricted requests work as before', async () => {
  assert.equal((await post(6, { userId: 6, requestId: 2 })).status, 201);
});