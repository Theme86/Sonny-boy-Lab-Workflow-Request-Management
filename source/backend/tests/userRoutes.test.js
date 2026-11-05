// Route tests for /api/users with an in-memory fake Prisma (no database needed).
// Run: npm test   (or: node --test tests/userRoutes.test.js)
process.env.JWT_SECRET = 'test-secret';

const { test, describe, beforeEach, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// ---------- fake database ----------
const mkUser = (userId, o = {}) => ({
  userId,
  firstName: 'First' + userId,
  lastName: 'Last' + userId,
  role: 'member',
  email: `u${userId}@ku.th`,
  googleId: 'google-' + userId, // must never be sent to clients
  avatarUrl: null,
  bannerUrl: null,
  createdAt: new Date(2026, 0, userId),
  lastLoginAt: null,
  active: true,
  studentId: null,
  phone: null,
  department: null,
  bio: null,
  profileCompletedAt: null,
  ...o,
});

let users = [];
const resetUsers = () => {
  users = [
    mkUser(1, { firstName: 'Alice', lastName: 'Anderson', studentId: '6710545001', department: 'CPE' }),
    mkUser(2, { firstName: 'Bob', lastName: 'Brown', phone: '0812345678' }),
    mkUser(3, { firstName: 'Carol', lastName: 'Clark', role: 'ta' }),
    mkUser(4, { firstName: 'Dan', lastName: 'Davis', role: 'lecturer' }),
    mkUser(5, { firstName: 'Eve', lastName: 'Evans', role: 'lab_manager' }),
    mkUser(6, { firstName: 'Frank', lastName: 'Fox', active: false }),
  ];
};

// Prisma's `select`: only the fields set to true come back
const pick = (row, select) => {
  if (!select) return { ...row };
  const out = {};
  for (const k of Object.keys(select)) if (select[k]) out[k] = row[k];
  return out;
};

const matches = (u, where = {}) => {
  if (where.role && u.role !== where.role) return false;
  if (where.active !== undefined && u.active !== where.active) return false;
  if (where.OR) {
    const hit = where.OR.some((cond) => {
      const [field, { contains }] = Object.entries(cond)[0];
      return String(u[field] ?? '').toLowerCase().includes(contains.toLowerCase());
    });
    if (!hit) return false;
  }
  return true;
};

const compare = (a, b, orderBy) => {
  for (const spec of orderBy) {
    const [key, dir] = Object.entries(spec)[0];
    let x = a[key], y = b[key];
    if (x instanceof Date) x = x.getTime();
    if (y instanceof Date) y = y.getTime();
    if (x === y) continue;
    const r = x < y ? -1 : 1;
    return dir === 'desc' ? -r : r;
  }
  return 0;
};

const fakePrisma = {
  user: {
    findUnique: async ({ where, select }) => {
      const row = users.find((u) => u.userId === where.userId);
      return row ? pick(row, select) : null;
    },
    update: async ({ where, data, select }) => {
      const row = users.find((u) => u.userId === where.userId);
      Object.assign(row, data);
      return pick(row, select);
    },
    count: async ({ where }) => users.filter((u) => matches(u, where)).length,
    findMany: async ({ where, orderBy = [], skip = 0, take, select }) =>
      users
        .filter((u) => matches(u, where))
        .sort((a, b) => compare(a, b, orderBy))
        .slice(skip, take === undefined ? undefined : skip + take)
        .map((u) => pick(u, select)),
  },
};

const stub = (modulePath, exports) => {
  const resolved = require.resolve(modulePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

stub('../lib/prisma', { prisma: fakePrisma });

// Image helpers are stubbed so tests never write to disk.
// The stub still uses the real file-type detection, so a non-image body is rejected with 415.
const realImages = require('../utils/saveUserImage');
const saved = [];
stub('../utils/saveUserImage', {
  detectImageExtension: realImages.detectImageExtension,
  saveUserImage: (userId, kind, buffer) => {
    if (!realImages.detectImageExtension(buffer)) {
      const err = new Error('Only JPG, PNG or WEBP images are allowed');
      err.status = 415;
      throw err;
    }
    saved.push({ userId, kind, bytes: buffer.length });
    return `/userImages/${userId}/${kind}.png?v=1`;
  },
});
let defaultBanner = '/userImages/1/banner.png';
stub('../utils/assignDefaultBanner', { assignDefaultBanner: () => defaultBanner });

const userRoutes = require('../routes/userRoutes');

// ---------- test server (same error format as index.js) ----------
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/users', userRoutes);
app.use((err, _req, res, _next) => res.status(err.status || err.statusCode || 500).json({ error: err.message }));

let server, base;
before(async () => {
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => {
  resetUsers();
  saved.length = 0;
  defaultBanner = '/userImages/1/banner.png';
});

// `role` in the cookie is what the token claims; the server must use the database value instead
const cookie = (userId, role = 'member') => `token=${jwt.sign({ userId, role }, process.env.JWT_SECRET)}`;
const as = (id) => cookie(id, users.find((u) => u.userId === id)?.role);

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
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(12)]);

// ================= authentication =================
describe('authentication', () => {
  test('401 without a login cookie, on every kind of route', async () => {
    for (const [m, u] of [['GET', '/api/users/me'], ['PATCH', '/api/users/me'], ['GET', '/api/users'], ['GET', '/api/users/1'], ['PUT', '/api/users/me/avatar']]) {
      assert.equal((await call(m, u)).status, 401, `${m} ${u}`);
    }
  });

  test('401 when the account in the token no longer exists', async () => {
    const res = await call('GET', '/api/users/me', { who: cookie(999) });
    assert.equal(res.status, 401);
  });

  test('403 for a disabled account', async () => {
    const res = await call('GET', '/api/users/me', { who: as(6) });
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error, 'Account disabled');
  });

  test('role comes from the database, not the token', async () => {
    // token claims lab_manager, database says member
    const res = await call('GET', '/api/users', { who: cookie(2, 'lab_manager') });
    assert.equal(res.status, 403);
  });

  test('a demotion applies immediately to a token that still claims the old role', async () => {
    const old = as(5);
    assert.equal((await call('GET', '/api/users', { who: old })).status, 200);
    users.find((u) => u.userId === 5).role = 'member';
    assert.equal((await call('GET', '/api/users', { who: old })).status, 403);
  });
});

// ================= GET /me =================
describe('GET /api/users/me', () => {
  test('returns my full profile including private fields', async () => {
    const res = await call('GET', '/api/users/me', { who: as(1) });
    assert.equal(res.status, 200);
    const me = await res.json();
    assert.equal(me.userId, 1);
    assert.equal(me.studentId, '6710545001');
    assert.ok('phone' in me);
  });

  test('never exposes googleId', async () => {
    const me = await (await call('GET', '/api/users/me', { who: as(1) })).json();
    assert.equal('googleId' in me, false);
  });

  test('"me" is not mistaken for an :id', async () => {
    const me = await (await call('GET', '/api/users/me', { who: as(2) })).json();
    assert.equal(me.userId, 2);
  });
});

// ================= PATCH /me =================
describe('PATCH /api/users/me', () => {
  const patch = (body, id = 1) => call('PATCH', '/api/users/me', { who: as(id), body });

  test('updates names, trimming and collapsing whitespace', async () => {
    const res = await patch({ firstName: '  Ada ', lastName: ' Von   Lovelace ' });
    assert.equal(res.status, 200);
    const me = await res.json();
    assert.equal(me.firstName, 'Ada');
    assert.equal(me.lastName, 'Von Lovelace');
  });

  test('rejects empty, too long and non-text names', async () => {
    assert.equal((await patch({ firstName: '   ' })).status, 400);
    assert.equal((await patch({ firstName: 'x'.repeat(101) })).status, 400);
    assert.equal((await patch({ lastName: 123 })).status, 400);
    assert.equal(users[0].firstName, 'Alice'); // nothing was saved
  });

  test('student ID: digits only, max 20, trimmed, empty clears it', async () => {
    assert.equal((await patch({ studentId: 'abc' })).status, 400);
    assert.equal((await patch({ studentId: '1'.repeat(21) })).status, 400);
    assert.equal((await (await patch({ studentId: ' 6710545725 ' })).json()).studentId, '6710545725');
    assert.equal((await (await patch({ studentId: '' })).json()).studentId, null);
  });

  test('phone: accepts +, digits, spaces and dashes; rejects letters and too-short numbers', async () => {
    assert.equal((await patch({ phone: '+66 81-234-5678' })).status, 200);
    assert.equal((await patch({ phone: 'abc123' })).status, 400);
    assert.equal((await patch({ phone: '12345' })).status, 400);
    assert.equal((await (await patch({ phone: null })).json()).phone, null);
  });

  test('department max 150 and bio max 300 characters', async () => {
    assert.equal((await patch({ department: 'd'.repeat(150) })).status, 200);
    assert.equal((await patch({ department: 'd'.repeat(151) })).status, 400);
    assert.equal((await patch({ bio: 'b'.repeat(300) })).status, 200);
    assert.equal((await patch({ bio: 'b'.repeat(301) })).status, 400);
  });

  test('400 "Nothing to update" for an empty body', async () => {
    const res = await patch({});
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'Nothing to update');
  });

  test('ignores fields a user must not change (role, active, email)', async () => {
    const res = await patch({ firstName: 'Alice2', role: 'lab_manager', active: false, email: 'evil@x.com' });
    assert.equal(res.status, 200);
    const u = users[0];
    assert.equal(u.role, 'member');
    assert.equal(u.active, true);
    assert.equal(u.email, 'u1@ku.th');
  });

  test('markProfileComplete records the time once and keeps the first value', async () => {
    const first = await (await patch({ markProfileComplete: true })).json();
    assert.ok(first.profileCompletedAt);
    const second = await (await patch({ markProfileComplete: true, bio: 'hi' })).json();
    assert.equal(new Date(second.profileCompletedAt).getTime(), new Date(first.profileCompletedAt).getTime());
  });

  test('edits only change the logged-in user', async () => {
    await patch({ firstName: 'Changed' }, 2);
    assert.equal(users[1].firstName, 'Changed');
    assert.equal(users[0].firstName, 'Alice');
  });
});

// ================= avatar / banner =================
describe('avatar and banner upload', () => {
  test('PUT avatar saves through the image helper and stores the URL', async () => {
    const res = await call('PUT', '/api/users/me/avatar', { who: as(1), raw: PNG });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).avatarUrl, '/userImages/1/avatar.png?v=1');
    assert.deepEqual(saved, [{ userId: 1, kind: 'avatar', bytes: PNG.length }]);
  });

  test('PUT banner works the same way and accepts JPEG', async () => {
    const res = await call('PUT', '/api/users/me/banner', { who: as(2), raw: JPG, contentType: 'image/jpeg' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).bannerUrl, '/userImages/2/banner.png?v=1');
    assert.equal(saved[0].kind, 'banner');
  });

  test('400 when there is no image in the body', async () => {
    assert.equal((await call('PUT', '/api/users/me/avatar', { who: as(1), raw: Buffer.alloc(0) })).status, 400);
    assert.equal((await call('PUT', '/api/users/me/avatar', { who: as(1), raw: 'hello', contentType: 'text/plain' })).status, 400);
    assert.equal(saved.length, 0);
  });

  test('415 when the bytes are not a real image, even if the header says image/png', async () => {
    const res = await call('PUT', '/api/users/me/avatar', { who: as(1), raw: Buffer.from('this is definitely not an image') });
    assert.equal(res.status, 415);
    assert.equal(users[0].avatarUrl, null);
  });

  test('DELETE banner restores the default banner', async () => {
    const res = await call('DELETE', '/api/users/me/banner', { who: as(1) });
    assert.equal(res.status, 200);
    assert.match((await res.json()).bannerUrl, /^\/userImages\/1\/banner\.png\?v=\d+$/);
  });

  test('DELETE banner returns 500 when no default banner can be created', async () => {
    defaultBanner = null;
    assert.equal((await call('DELETE', '/api/users/me/banner', { who: as(1) })).status, 500);
  });
});

// ================= user management (lab manager) =================
describe('GET /api/users (user management)', () => {
  const list = async (qs = '', id = 5) => (await call('GET', '/api/users' + qs, { who: as(id) })).json();
  const ids = (r) => r.users.map((u) => u.userId);

  test('only lab managers may list users', async () => {
    for (const id of [1, 3, 4]) assert.equal((await call('GET', '/api/users', { who: as(id) })).status, 403, `user ${id}`);
    assert.equal((await call('GET', '/api/users', { who: as(5) })).status, 200);
  });

  test('response shape and default order (newest first)', async () => {
    const r = await list();
    assert.deepEqual(Object.keys(r).sort(), ['page', 'pageSize', 'total', 'totalPages', 'users']);
    assert.equal(r.total, 6);
    assert.deepEqual(ids(r), [6, 5, 4, 3, 2, 1]);
  });

  test('pagination', async () => {
    const p2 = await list('?pageSize=2&page=2');
    assert.deepEqual(ids(p2), [4, 3]);
    assert.equal(p2.totalPages, 3);
    assert.equal(p2.page, 2);
  });

  test('page size is capped at 100 and a bad page falls back to 1', async () => {
    const r = await list('?pageSize=1000&page=0');
    assert.equal(r.pageSize, 100);
    assert.equal(r.page, 1);
  });

  test('filter by role and by active status', async () => {
    assert.deepEqual(ids(await list('?role=ta')), [3]);
    assert.deepEqual(ids(await list('?status=inactive')), [6]);
    assert.equal((await list('?status=active')).total, 5);
    assert.equal((await list('?status=all')).total, 6);
  });

  test('400 for an unknown role filter', async () => {
    assert.equal((await call('GET', '/api/users?role=admin', { who: as(5) })).status, 400);
  });

  test('search matches name, email, student ID and department, ignoring case', async () => {
    assert.deepEqual(ids(await list('?q=ANDERSON')), [1]);
    assert.deepEqual(ids(await list('?q=u3@')), [3]);
    assert.deepEqual(ids(await list('?q=6710545001')), [1]);
    assert.deepEqual(ids(await list('?q=cpe')), [1]);
    assert.deepEqual(ids(await list('?q=nobody')), []);
  });

  test('sort by name ascending; an unknown sort field falls back to createdAt', async () => {
    assert.deepEqual(ids(await list('?sort=name&order=asc')), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(ids(await list('?sort=password&order=asc')), [1, 2, 3, 4, 5, 6]);
  });

  test('includes private fields for the manager but never googleId', async () => {
    const r = await list();
    assert.ok(r.users.every((u) => !('googleId' in u)));
    assert.equal(r.users.find((u) => u.userId === 1).studentId, '6710545001');
  });
});

describe('PATCH /api/users/:id/role', () => {
  const setRole = (id, body, who = 5) => call('PATCH', `/api/users/${id}/role`, { who: as(who), body });

  test('lab manager can change another user\'s role', async () => {
    const res = await setRole(2, { role: 'ta' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).role, 'ta');
    assert.equal(users[1].role, 'ta');
  });

  test('403 for everyone else', async () => {
    for (const id of [1, 3, 4]) assert.equal((await setRole(2, { role: 'ta' }, id)).status, 403, `user ${id}`);
    assert.equal(users[1].role, 'member');
  });

  test('400 for an invalid role', async () => {
    assert.equal((await setRole(2, { role: 'admin' })).status, 400);
    assert.equal((await setRole(2, {})).status, 400);
  });

  test('a lab manager cannot change their own role', async () => {
    const res = await setRole(5, { role: 'member' });
    assert.equal(res.status, 400);
    assert.equal(users[4].role, 'lab_manager');
  });

  test('404 for an unknown user and 400 for a bad id', async () => {
    assert.equal((await setRole(999, { role: 'ta' })).status, 404);
    assert.equal((await setRole('abc', { role: 'ta' })).status, 400);
  });
});

describe('PATCH /api/users/:id/active', () => {
  const setActive = (id, body, who = 5) => call('PATCH', `/api/users/${id}/active`, { who: as(who), body });

  test('deactivate and reactivate a user', async () => {
    assert.equal((await (await setActive(2, { active: false })).json()).active, false);
    assert.equal(users[1].active, false);
    assert.equal((await (await setActive(6, { active: true })).json()).active, true);
  });

  test('a deactivated user is locked out on their very next request', async () => {
    const token = as(2);
    assert.equal((await call('GET', '/api/users/me', { who: token })).status, 200);
    await setActive(2, { active: false });
    assert.equal((await call('GET', '/api/users/me', { who: token })).status, 403);
  });

  test('400 unless active is a real boolean', async () => {
    for (const bad of ['false', 0, null, undefined]) assert.equal((await setActive(2, { active: bad })).status, 400, String(bad));
  });

  test('a lab manager cannot deactivate themselves', async () => {
    assert.equal((await setActive(5, { active: false })).status, 400);
    assert.equal(users[4].active, true);
  });

  test('403 for non-managers, 404 for an unknown user', async () => {
    assert.equal((await setActive(2, { active: false }, 3)).status, 403);
    assert.equal((await setActive(999, { active: false })).status, 404);
  });
});

// ================= viewing another user =================
describe('GET /api/users/:id', () => {
  const view = (id, who) => call('GET', `/api/users/${id}`, { who: as(who) });

  test('a user sees their own private fields', async () => {
    const u = await (await view(1, 1)).json();
    assert.equal(u.studentId, '6710545001');
  });

  test('another member sees only public fields', async () => {
    const u = await (await view(2, 1)).json();
    assert.equal(u.userId, 2);
    assert.ok(u.email && u.firstName);
    assert.equal('phone' in u, false);
    assert.equal('studentId' in u, false);
    assert.equal('googleId' in u, false);
  });

  test('a lab manager sees private fields of anyone', async () => {
    const u = await (await view(2, 5)).json();
    assert.equal(u.phone, '0812345678');
  });

  test('a TA or lecturer does not get private fields', async () => {
    assert.equal('phone' in (await (await view(2, 3)).json()), false);
    assert.equal('phone' in (await (await view(2, 4)).json()), false);
  });

  test('404 for an unknown user, 400 for a bad id', async () => {
    assert.equal((await view(999, 1)).status, 404);
    assert.equal((await view('abc', 1)).status, 400);
  });
});
