const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { makeFakePrisma } = require('./support/fakeDashboardPrisma');

process.env.JWT_SECRET = 'test-secret';

const USERS = [
  { userId: 1, role: 'lab_manager', active: true },
  { userId: 2, role: 'ta', active: true },
  { userId: 3, role: 'lecturer', active: true },
  { userId: 4, role: 'member', active: true },
  { userId: 5, role: 'member', active: false },
];

// Start a server on a random port with a fresh fake database; the route file is loaded after the fake is in place.
async function startServer(data = {}) {
  const fake = makeFakePrisma({ users: USERS, ...data });
  const prismaPath = path.join(__dirname, '..', 'lib', 'prisma.js');
  const routePath = path.join(__dirname, '..', 'routes', 'dashboardRoutes.js');
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { prisma: fake.prisma } };
  delete require.cache[routePath];
  const router = require(routePath);

  const app = express();
  app.use(cookieParser());
  app.use('/api/dashboard', router);
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/dashboard`;
  return { ...fake, base, close: () => new Promise((resolve) => server.close(resolve)) };
}

// The token carries an out-of-date role on purpose: the server must use the role from the database.
const cookieFor = (userId) => `token=${jwt.sign({ userId, role: 'lab_manager' }, 'test-secret')}`;
const get = (base, userId, query = '') => fetch(base + query, { headers: userId ? { cookie: cookieFor(userId) } : {} });

test('401 without a login', async () => {
  const s = await startServer();
  assert.equal((await get(s.base, null)).status, 401);
  await s.close();
});

test('403 for a disabled account and 401 for a missing one', async () => {
  const s = await startServer();
  assert.equal((await get(s.base, 5)).status, 403);
  assert.equal((await get(s.base, 99)).status, 401);
  await s.close();
});

test('a member gets no attention section and no staff queries run', async () => {
  const s = await startServer({ requestCount: 8, pendingSessions: 3, newMembers: 2 });
  const res = await get(s.base, 4);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.role, 'member');
  assert.equal(body.attention, null);
  assert.equal(s.callsTo('user.count').length, 0);
  assert.equal(s.callsTo('labSession.count').length, 0);
  assert.equal(s.callsTo('request.count').length, 0);
  assert.equal(s.callsTo('labSession.findMany').some((c) => c.args.where.status === 'pending_approval'), false);
  assert.equal(s.callsTo('request.findMany').some((c) => c.args.where.assignedTo === null), false);
  assert.equal(JSON.stringify(body).includes('pendingSessions'), false);
  await s.close();
});

test('the role comes from the database, not from the token', async () => {
  const s = await startServer();
  const body = await (await get(s.base, 4)).json();
  assert.equal(body.role, 'member');
  assert.equal(body.attention, null);
  await s.close();
});

for (const [userId, role, keys] of [
  [2, 'ta', ['requests']],
  [3, 'lecturer', ['requests', 'pendingSessions']],
  [1, 'lab_manager', ['requests', 'pendingSessions', 'newMembers']],
]) {
  test(`${role} gets exactly ${keys.join(', ')} in attention`, async () => {
    const s = await startServer();
    const body = await (await get(s.base, userId)).json();
    assert.deepEqual(Object.keys(body.attention).sort(), [...keys].sort());
    await s.close();
  });
}

test('response has the expected shape for everyone', async () => {
  const s = await startServer();
  const body = await (await get(s.base, 4)).json();
  assert.deepEqual(Object.keys(body).sort(), ['attention', 'generatedAt', 'lab', 'me', 'role']);
  assert.deepEqual(Object.keys(body.me).sort(), ['notifications', 'requests', 'upcomingSessions']);
  assert.deepEqual(Object.keys(body.lab).sort(), ['consumables', 'equipment', 'rooms']);
  await s.close();
});

test('the room window from the browser is used', async () => {
  const s = await startServer();
  const from = '2026-11-05T00:00:00.000Z';
  const to = '2026-11-06T00:00:00.000Z';
  const body = await (await get(s.base, 4, `?from=${from}&to=${to}`)).json();
  assert.equal(body.lab.rooms.from, from);
  assert.equal(body.lab.rooms.to, to);
  await s.close();
});

for (const [label, query] of [
  ['only from', '?from=2026-11-05T00:00:00Z'],
  ['to before from', '?from=2026-11-06T00:00:00Z&to=2026-11-05T00:00:00Z'],
  ['more than 48 hours', '?from=2026-11-01T00:00:00Z&to=2026-11-05T00:00:00Z'],
  ['not a date', '?from=abc&to=def'],
]) {
  test(`400 for a bad window: ${label}`, async () => {
    const s = await startServer();
    assert.equal((await get(s.base, 4, query)).status, 400);
    await s.close();
  });
}
