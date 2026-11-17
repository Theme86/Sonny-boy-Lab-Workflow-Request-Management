// US-7 / US-8 (SRS-14…17): industry collaboration requests and the "restricted" visibility rule.
// In-memory fake Prisma that understands the where-filters the routes build (AND / OR / NOT / is).
process.env.JWT_SECRET = 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// 1 member, 2 lecturer (Ann), 3 lab_manager, 4 TA (assigned), 5 TA (other), 6 lecturer (other)
const roles = { 1: 'member', 2: 'lecturer', 3: 'lab_manager', 4: 'ta', 5: 'ta', 6: 'lecturer' };
const db = { requests: [], history: [], notifications: [], logs: [], nextId: 1 };

function matches(row, where = {}) {
  return Object.entries(where).every(([key, cond]) => {
    if (key === 'AND') return cond.every((c) => matches(row, c));
    if (key === 'OR') return cond.some((c) => matches(row, c));
    if (key === 'NOT') return !matches(row, cond);
    if (key === 'industryDetail') {
      const d = row.industryDetail;
      return cond.is ? (d ? matches(d, cond.is) : false) : true;
    }
    return row[key] === cond;
  });
}

const fakePrisma = {
  equipment: { findUnique: async () => null },
  $transaction: async (fn) => fn(fakePrisma),
  user: {
    findUnique: async ({ where }) => (roles[where.userId] ? { userId: where.userId, role: roles[where.userId], active: true } : null),
    findMany: async ({ where }) =>
      Object.entries(roles)
        .map(([id, role]) => ({ userId: Number(id), role }))
        .filter((u) => where.role.in.includes(u.role) && u.userId !== where.userId.not),
  },
  notification: { createMany: async ({ data }) => { db.notifications.push(...data); return { count: data.length }; } },
  restrictedAccessLog: { create: async ({ data }) => db.logs.push({ ...data, accessedAt: new Date() }) },
  requestStatusHistory: { create: async ({ data }) => db.history.push(data) },
  request: {
    create: async ({ data }) => {
      const row = {
        requestId: db.nextId++, ...data, assignedTo: null, status: 'open', createdAt: new Date(),
        accessDetail: null, industryDetail: data.industryDetail?.create ?? null, statusHistory: [],
      };
      db.requests.push(row);
      return row;
    },
    findMany: async ({ where, include }) => { db.lastInclude = include; return db.requests.filter((r) => matches(r, where)); },
    count: async ({ where }) => db.requests.filter((r) => matches(r, where)).length,
    findUnique: async ({ where }) => db.requests.find((r) => r.requestId === where.requestId) ?? null,
    updateMany: async ({ where, data }) => {
      const rows = db.requests.filter((r) => r.requestId === where.requestId && r.status === where.status);
      rows.forEach((r) => Object.assign(r, data));
      return { count: rows.length };
    },
  },
};
require.cache[require.resolve('../lib/prisma')] = {
  id: require.resolve('../lib/prisma'), filename: require.resolve('../lib/prisma'), loaded: true, exports: { prisma: fakePrisma },
};

const requestRoutes = require('../routes/requestRoutes');
const { attention } = require('../services/dashboard/attention');
const { validateRequestInput } = require('../utils/validateRequest');

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

const as = (id) => `token=${jwt.sign({ userId: id, role: roles[id] }, process.env.JWT_SECRET)}`;
const call = (method, url, { user, body } = {}) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(user ? { Cookie: as(user) } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

const industry = {
  type: 'industry_collaboration', title: 'Joint sensor study', description: 'Test sensors for ACME',
  partnerCompany: 'ACME Co', contactName: 'Mr Smith', contactEmail: 'smith@acme.com',
};
const normal = { type: 'ticket', title: 'Fix script', description: 'Backup script fails' };

// create: id 1 = restricted (by lecturer 2), id 2 = public (by lecturer 2), id 3 = normal ticket (by member 1)
async function seed() {
  db.requests.length = 0; db.history.length = 0; db.notifications.length = 0; db.logs.length = 0; db.nextId = 1;
  await call('POST', '/api/requests', { user: 2, body: industry });
  await call('POST', '/api/requests', { user: 2, body: { ...industry, title: 'Public study', confidentiality: 'public' } });
  await call('POST', '/api/requests', { user: 1, body: normal });
  db.requests[0].assignedTo = 4; // TA 4 is assigned to the restricted request
  db.notifications.length = 0;
}

// ---------- US-7 ----------
test('US-7: lecturer submits -> 201, detail saved, level defaults to restricted (SRS-15)', async () => {
  db.requests.length = 0; db.nextId = 1;
  const res = await call('POST', '/api/requests', { user: 2, body: industry });
  assert.equal(res.status, 201);
  const { request } = await res.json();
  assert.equal(request.industryDetail.partnerCompany, 'ACME Co');
  assert.equal(request.industryDetail.confidentiality, 'restricted');
  assert.equal(db.requests.length, 1);
});

test('US-7: lab manager may submit; member and TA get 403', async () => {
  assert.equal((await call('POST', '/api/requests', { user: 3, body: industry })).status, 201);
  assert.equal((await call('POST', '/api/requests', { user: 1, body: industry })).status, 403);
  assert.equal((await call('POST', '/api/requests', { user: 4, body: industry })).status, 403);
});

test('US-7: missing partner or contact -> 400 with a message per field (SRS-14)', async () => {
  const res = await call('POST', '/api/requests', { user: 2, body: { ...industry, partnerCompany: '', contactName: '', contactEmail: 'nope' } });
  assert.equal(res.status, 400);
  const { details } = await res.json();
  assert.ok(details.partnerCompany && details.contactName && details.contactEmail);
});

test('validation: level must be one of the three; phone is optional', () => {
  assert.equal(validateRequestInput({ ...industry, confidentiality: 'secret' }).errors.confidentiality.includes('public'), true);
  const ok = validateRequestInput({ ...industry, confidentiality: 'internal', contactPhone: '' });
  assert.equal(ok.ok, true);
  assert.equal(ok.data.industry.contactPhone, null);
  assert.equal(validateRequestInput({ ...normal }).data.industry, null);
});

// ---------- US-8: list ----------
test('US-8 list: lab manager sees all, requester and assigned TA see the restricted one', async () => {
  await seed();
  const ids = async (u) => (await (await call('GET', '/api/requests', { user: u })).json()).items.map((r) => r.requestId).sort();
  assert.deepEqual(await ids(3), [1, 2, 3]);
  assert.deepEqual(await ids(2), [1, 2, 3]); // requester (lecturer 2) sees own restricted + others
  assert.deepEqual(await ids(4), [1, 2, 3]); // assigned TA
});

test('US-8 list: other lecturer / TA do not see the restricted one, and the total matches', async () => {
  await seed();
  for (const u of [5, 6]) {
    const body = await (await call('GET', '/api/requests', { user: u })).json();
    assert.deepEqual(body.items.map((r) => r.requestId).sort(), [2, 3]);
    assert.equal(body.total, 2);
  }
});

test('US-8 list: public and internal industry requests stay visible to staff; member sees only own', async () => {
  await seed();
  assert.deepEqual((await (await call('GET', '/api/requests', { user: 1 })).json()).items.map((r) => r.requestId), [3]);
});

// ---------- US-8: detail ----------
test('US-8 detail: authorised people open it and every open is logged (SRS-17)', async () => {
  await seed();
  for (const u of [2, 3, 4]) assert.equal((await call('GET', '/api/requests/1', { user: u })).status, 200);
  assert.deepEqual(db.logs.map((l) => [l.requestId, l.userId]), [[1, 2], [1, 3], [1, 4]]);
});

test('US-8 detail: others get 403 with an access-restricted message and are not logged', async () => {
  await seed();
  for (const u of [1, 5, 6]) {
    const res = await call('GET', '/api/requests/1', { user: u });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.restricted, true);
    assert.match(body.error, /Access restricted/);
  }
  assert.equal(db.logs.length, 0);
});

test('detail of a public industry request or a normal request is not logged and stays open to staff', async () => {
  await seed();
  assert.equal((await call('GET', '/api/requests/2', { user: 5 })).status, 200);
  assert.equal((await call('GET', '/api/requests/3', { user: 5 })).status, 200);
  assert.equal(db.logs.length, 0);
  assert.equal((await call('GET', '/api/requests/3', { user: 6 })).status, 200);
});

// ---------- US-8: changing ----------
test('US-8 status/assignee: staff who cannot see it get 403; only the Lab Manager assigns', async () => {
  await seed();
  assert.equal((await call('PATCH', '/api/requests/1/status', { user: 5, body: { status: 'in_progress' } })).status, 403);
  assert.equal((await call('PATCH', '/api/requests/1/assignee', { user: 5, body: { assigneeId: 5 } })).status, 403);
  assert.equal((await call('PATCH', '/api/requests/1/assignee', { user: 4, body: { assigneeId: 5 } })).status, 403); // assigned TA may view, not reassign
  assert.equal((await call('PATCH', '/api/requests/1/status', { user: 4, body: { status: 'in_progress' } })).status, 200); // assigned TA may work on it
  assert.equal((await call('PATCH', '/api/requests/1/assignee', { user: 3, body: { assigneeId: 5 } })).status, 200);
  assert.equal(db.requests[0].assignedTo, 5);
});

// ---------- notifications ----------
test('notification: restricted -> lab managers only; public -> lecturers and lab managers (SRS-16)', async () => {
  db.requests.length = 0; db.notifications.length = 0; db.nextId = 1;
  await call('POST', '/api/requests', { user: 2, body: industry });
  assert.deepEqual(db.notifications.map((n) => n.userId), [3]);
  db.notifications.length = 0;
  await call('POST', '/api/requests', { user: 2, body: { ...industry, confidentiality: 'public' } });
  assert.deepEqual(db.notifications.map((n) => n.userId).sort(), [3, 6]);
});

// ---------- dashboard ----------
test('dashboard: queue and blocked count carry the visibility rule for TA/lecturer, not for the Lab Manager', async () => {
  const seen = [];
  const prisma = {
    request: {
      count: async ({ where }) => { seen.push(where); return 0; },
      findMany: async ({ where }) => { seen.push(where); return []; },
    },
    labSession: { count: async () => 0, findMany: async () => [] },
    user: { count: async () => 0 },
  };
  await attention(prisma, { userId: 5, role: 'ta' }, new Date());
  const withRule = seen.filter((w) => w.AND);
  assert.ok(withRule.length >= 3, 'unassigned count, unassigned list and blocked count carry AND');
  seen.length = 0;
  await attention(prisma, { userId: 3, role: 'lab_manager' }, new Date());
  assert.equal(seen.filter((w) => w.AND).length, 0);
});

test('list queries select only the level of an industry request, never the partner details', async () => {
  await seed();
  await call('GET', '/api/requests', { user: 3 });
  assert.deepEqual(db.lastInclude.industryDetail, { select: { confidentiality: true } });
});