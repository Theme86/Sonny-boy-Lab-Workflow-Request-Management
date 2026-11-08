// Tests for the notifications created by the request and lab-session routes.
// Uses an in-memory fake Prisma (no database needed), like requestRoutes.test.js.
process.env.JWT_SECRET = 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// ---- fake data ----
const USERS = [
  { userId: 1, role: 'member', active: true },
  { userId: 2, role: 'ta', active: true },
  { userId: 3, role: 'lecturer', active: true },
  { userId: 4, role: 'lab_manager', active: true },
  { userId: 5, role: 'lecturer', active: false }, // disabled: must not be notified
  { userId: 6, role: 'lab_manager', active: true },
];
const db = { requests: [], history: [], sessions: [], notifications: [], nextId: 1 };
const person = (id) => ({ userId: id, firstName: 'U' + id, lastName: 'X', email: `u${id}@x.com` });

const fakePrisma = {
  $transaction: async (fn) => fn(fakePrisma),
  $queryRaw: async () => [{ room_id: 1 }], // the room-lock query
  user: {
    findUnique: async ({ where }) => USERS.find((u) => u.userId === where.userId) ?? null,
    findMany: async ({ where }) =>
      USERS.filter(
        (u) =>
          (where.active === undefined || u.active === where.active) &&
          (!where.role?.in || where.role.in.includes(u.role)) &&
          (where.userId?.not === undefined || u.userId !== where.userId.not)
      ).map((u) => ({ userId: u.userId })),
  },
  equipment: { findUnique: async () => ({ equipmentId: 1 }) },
  request: {
    create: async ({ data }) => {
      const row = {
        requestId: db.nextId++, ...data, status: 'open', assignedTo: null, createdAt: new Date(),
        accessDetail: null, requester: person(data.requesterId),
      };
      db.requests.push(row);
      return row;
    },
    findUnique: async ({ where }) => {
      const r = db.requests.find((x) => x.requestId === where.requestId);
      return r ? { ...r, assignee: r.assignedTo ? person(r.assignedTo) : null } : null;
    },
    updateMany: async ({ where, data }) => {
      const r = db.requests.find((x) => x.requestId === where.requestId && x.status === where.status);
      if (!r) return { count: 0 };
      Object.assign(r, data);
      return { count: 1 };
    },
  },
  requestStatusHistory: { create: async ({ data }) => db.history.push(data) },
  labSession: {
    findFirst: async () => null, // no clash
    create: async ({ data }) => {
      const row = { labSessionId: db.nextId++, ...data, status: 'pending_approval' };
      db.sessions.push(row);
      return row;
    },
  },
  notification: {
    createMany: async ({ data }) => {
      for (const d of data) {
        // the real table requires exactly one of request_id / lab_session_id
        assert.ok((d.requestId != null) !== (d.labSessionId != null), 'exactly one target');
        assert.ok(d.message.length <= 255, 'message fits VARCHAR(255)');
        db.notifications.push(d);
      }
      return { count: data.length };
    },
  },
};
require.cache[require.resolve('../lib/prisma')] = {
  id: require.resolve('../lib/prisma'), filename: require.resolve('../lib/prisma'), loaded: true,
  exports: { prisma: fakePrisma },
};

const { requireAuth } = require('../middleware/auth');
const requestRoutes = require('../routes/requestRoutes');
const labSessionRoutes = require('../routes/labSessionRoutes');
const { fit, notifyUsers } = require('../utils/notify');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/requests', requestRoutes);
app.use('/api/lab-sessions', requireAuth, labSessionRoutes);
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message })); // like index.js

let server, base;
test.before(async () => {
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());
test.beforeEach(() => {
  db.requests.length = db.history.length = db.sessions.length = db.notifications.length = 0;
});

const as = (userId) => `token=${jwt.sign({ userId, role: 'member' }, process.env.JWT_SECRET)}`;
const call = (method, url, userId, body) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: as(userId) },
    body: body ? JSON.stringify(body) : undefined,
  });
const recipients = () => db.notifications.map((n) => n.userId).sort((a, b) => a - b);

const goodRequest = { type: 'maintenance', title: 'Microscope broken', description: 'Lens is cracked', equipmentId: 1 };
const soon = (h) => new Date(Date.now() + h * 3600_000).toISOString();
const goodSession = { name: 'Chem lab', roomId: 1, requestedStart: soon(24), requestedEnd: soon(26) };

// ---------------- 3) new request -> lecturers + lab managers ----------------

test('new request: every active lecturer and lab manager is notified, nobody else', async () => {
  const res = await call('POST', '/api/requests', 1, goodRequest);
  assert.equal(res.status, 201);
  const { request } = await res.json();

  assert.deepEqual(recipients(), [3, 4, 6]); // not the TA (2), not the disabled lecturer (5), not the requester (1)
  for (const n of db.notifications) {
    assert.equal(n.notifType, 'approval_needed');
    assert.equal(n.requestId, request.requestId);
    assert.equal(n.labSessionId, undefined);
    assert.equal(n.message, 'New maintenance request needs review: "Microscope broken"');
  }
});

test('new request by a lecturer: they are not told about their own request', async () => {
  await call('POST', '/api/requests', 3, goodRequest);
  assert.deepEqual(recipients(), [4, 6]);
});

test('invalid request: nothing is created, nobody is notified', async () => {
  const res = await call('POST', '/api/requests', 1, { type: 'ticket', title: '' });
  assert.equal(res.status, 400);
  assert.equal(db.notifications.length, 0);
});

// ---------------- 1) status change -> requester ----------------

async function openRequestBy(userId) {
  const { request } = await (await call('POST', '/api/requests', userId, goodRequest)).json();
  db.notifications.length = 0; // forget the "new request" messages
  return request.requestId;
}

test('status change: the requester is told', async () => {
  const id = await openRequestBy(1);
  const res = await call('PATCH', `/api/requests/${id}/status`, 2, { status: 'in_review' });
  assert.equal(res.status, 200);
  assert.deepEqual(db.notifications, [
    { userId: 1, requestId: id, message: 'Your request "Microscope broken" is now in review', notifType: 'status_change' },
  ]);
});

test('status change by the requester themselves (a lecturer): no message', async () => {
  const id = await openRequestBy(3);
  await call('PATCH', `/api/requests/${id}/status`, 3, { status: 'in_review' });
  assert.equal(db.notifications.length, 0);
});

test('a rejected status change (not allowed) sends nothing', async () => {
  const id = await openRequestBy(1);
  const res = await call('PATCH', `/api/requests/${id}/status`, 2, { status: 'completed' }); // open -> completed is not allowed
  assert.equal(res.status, 409);
  assert.equal(db.notifications.length, 0);
});

test('a member cannot change status, and nothing is sent', async () => {
  const id = await openRequestBy(1);
  const res = await call('PATCH', `/api/requests/${id}/status`, 1, { status: 'in_review' });
  assert.equal(res.status, 403);
  assert.equal(db.notifications.length, 0);
});

// ---------------- 2) assignment -> assignee (+ requester when it moves to in review) ----------------

test('assign an open request: assignee is told, and the requester hears it is in review', async () => {
  const id = await openRequestBy(1);
  const res = await call('PATCH', `/api/requests/${id}/assignee`, 4, { assigneeId: 2 });
  assert.equal(res.status, 200);
  assert.deepEqual(db.notifications, [
    { userId: 1, requestId: id, message: 'Your request "Microscope broken" is now in review', notifType: 'status_change' },
    { userId: 2, requestId: id, message: 'You were assigned the request "Microscope broken"', notifType: 'status_change' },
  ]);
});

test('assign a request that is already in review: only the assignee is told', async () => {
  const id = await openRequestBy(1);
  await call('PATCH', `/api/requests/${id}/status`, 2, { status: 'in_review' });
  db.notifications.length = 0;
  await call('PATCH', `/api/requests/${id}/assignee`, 4, { assigneeId: 2 });
  assert.deepEqual(recipients(), [2]);
});

test('assigning yourself sends you nothing', async () => {
  const id = await openRequestBy(1);
  await call('PATCH', `/api/requests/${id}/assignee`, 4, { assigneeId: 4 });
  assert.deepEqual(recipients(), [1]); // only the requester (in review)
});

test('assigning the same person again, or unassigning, sends nothing to the assignee', async () => {
  const id = await openRequestBy(1);
  await call('PATCH', `/api/requests/${id}/assignee`, 4, { assigneeId: 2 });
  db.notifications.length = 0;
  await call('PATCH', `/api/requests/${id}/assignee`, 4, { assigneeId: 2 });
  assert.equal(db.notifications.length, 0);
  await call('PATCH', `/api/requests/${id}/assignee`, 4, { assigneeId: null });
  assert.equal(db.notifications.length, 0);
});

// ---------------- 4) new lab session -> lecturers + lab managers ----------------

test('new lab session: every active lecturer and lab manager is told', async () => {
  const res = await call('POST', '/api/lab-sessions', 1, goodSession);
  assert.equal(res.status, 201);
  const session = await res.json();

  assert.deepEqual(recipients(), [3, 4, 6]);
  for (const n of db.notifications) {
    assert.equal(n.notifType, 'approval_needed');
    assert.equal(n.labSessionId, session.labSessionId);
    assert.equal(n.requestId, undefined);
    assert.equal(n.message, 'New lab session "Chem lab" needs approval');
  }
});

test('new lab session booked by a lab manager: they are not told about their own booking', async () => {
  await call('POST', '/api/lab-sessions', 4, goodSession);
  assert.deepEqual(recipients(), [3, 6]);
});

test('batch booking: ONE message per approver, about the first session', async () => {
  const slots = [0, 1, 2].map((i) => ({ start: soon(24 + i * 3), end: soon(25 + i * 3) }));
  const res = await call('POST', '/api/lab-sessions/batch', 1, { name: 'Chem lab', roomId: 1, slots });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.length, 3);

  assert.deepEqual(recipients(), [3, 4, 6]);
  for (const n of db.notifications) {
    assert.equal(n.labSessionId, created[0].labSessionId);
    assert.equal(n.message, 'New lab session "Chem lab" (3 time slots) needs approval');
  }
});

test('invalid lab session: nothing is created, nobody is notified', async () => {
  const res = await call('POST', '/api/lab-sessions', 1, { ...goodSession, requestedEnd: goodSession.requestedStart });
  assert.ok(res.status >= 400);
  assert.equal(db.notifications.length, 0);
});

// ---------------- helper ----------------

test('fit() cuts a message that is too long for the column', () => {
  assert.equal(fit('short'), 'short');
  const cut = fit('x'.repeat(400));
  assert.equal(cut.length, 255);
  assert.ok(cut.endsWith('…'));
});

test('notifyUsers: no users = no query; duplicates are sent once', async () => {
  const calls = [];
  const fake = { notification: { createMany: async (a) => calls.push(a) } };
  await notifyUsers(fake, [], { target: { requestId: 1 }, message: 'x', notifType: 'reminder' });
  assert.equal(calls.length, 0);
  await notifyUsers(fake, [7, 7, 8], { target: { requestId: 1 }, message: 'x', notifType: 'reminder' });
  assert.deepEqual(calls[0].data.map((d) => d.userId), [7, 8]);
});