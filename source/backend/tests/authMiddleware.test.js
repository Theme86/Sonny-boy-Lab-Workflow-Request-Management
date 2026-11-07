// requireAuth / requireRole / requireActiveUser, run directly with fake req / res objects.
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const path = require('path');

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;

// requireActiveUser loads the database lazily, so a fake one can be put in place before it is called
const prismaPath = path.join(__dirname, '..', 'lib', 'prisma.js');
let dbUser = null;
let dbError = null;
let lastQuery = null;
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: {
    prisma: {
      user: {
        findUnique: async (query) => {
          lastQuery = query;
          if (dbError) throw dbError;
          return dbUser;
        },
      },
    },
  },
};
const { requireAuth, requireRole, requireActiveUser } = require('../middleware/auth');

function fakeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (body) => ((res.body = body), res);
  return res;
}
function run(middleware, req) {
  const res = fakeRes();
  let nextArg = 'not called';
  const result = middleware(req, res, (arg) => (nextArg = arg));
  return Promise.resolve(result).then(() => ({ res, nextArg }));
}

describe('requireAuth', () => {
  const sign = (payload, options) => jwt.sign(payload, SECRET, options);

  test('no cookie: 401 "No token"', async () => {
    const { res, nextArg } = await run(requireAuth, { cookies: {} });
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'No token' });
    assert.equal(nextArg, 'not called');
  });

  test('cookie-parser missing altogether does not crash', async () => {
    const { res } = await run(requireAuth, {});
    assert.equal(res.statusCode, 401);
  });

  test('a valid token puts the payload on req.user and continues', async () => {
    const req = { cookies: { token: sign({ userId: 4, role: 'ta' }) } };
    const { res, nextArg } = await run(requireAuth, req);
    assert.equal(nextArg, undefined);
    assert.equal(res.body, undefined);
    assert.equal(req.user.userId, 4);
    assert.equal(req.user.role, 'ta');
  });

  test('a token signed with another secret is rejected', async () => {
    const forged = jwt.sign({ userId: 1, role: 'lab_manager' }, 'someone-elses-secret');
    const { res, nextArg } = await run(requireAuth, { cookies: { token: forged } });
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'Invalid or expired token' });
    assert.equal(nextArg, 'not called');
  });

  test('an expired token is rejected', async () => {
    const expired = sign({ userId: 1 }, { expiresIn: -10 });
    const { res } = await run(requireAuth, { cookies: { token: expired } });
    assert.equal(res.statusCode, 401);
  });

  test('garbage in the cookie is rejected', async () => {
    const { res } = await run(requireAuth, { cookies: { token: 'not.a.jwt' } });
    assert.equal(res.statusCode, 401);
  });

  test('an unsigned token (alg none) is rejected', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ userId: 1, role: 'lab_manager' })).toString('base64url');
    const { res } = await run(requireAuth, { cookies: { token: `${header}.${body}.` } });
    assert.equal(res.statusCode, 401);
  });
});

describe('requireRole', () => {
  test('lets a listed role through', async () => {
    const { res, nextArg } = await run(requireRole('lecturer', 'lab_manager'), { user: { role: 'lecturer' } });
    assert.equal(nextArg, undefined);
    assert.equal(res.body, undefined);
  });

  test('refuses an unlisted role with 403', async () => {
    const { res, nextArg } = await run(requireRole('lab_manager'), { user: { role: 'member' } });
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: 'Forbidden' });
    assert.equal(nextArg, 'not called');
  });

  test('refuses when nobody is logged in (used without requireAuth)', async () => {
    const { res } = await run(requireRole('member'), {});
    assert.equal(res.statusCode, 403);
  });

  test('with no roles listed nobody passes', async () => {
    const { res } = await run(requireRole(), { user: { role: 'lab_manager' } });
    assert.equal(res.statusCode, 403);
  });
});

describe('requireActiveUser', () => {
  beforeEach(() => {
    dbUser = { userId: 4, role: 'ta', active: true };
    dbError = null;
    lastQuery = null;
  });

  test('looks the user up by the id in the token', async () => {
    await run(requireActiveUser, { user: { userId: 4, role: 'ta' } });
    assert.equal(lastQuery.where.userId, 4);
  });

  test('continues for an active user', async () => {
    const { res, nextArg } = await run(requireActiveUser, { user: { userId: 4, role: 'ta' } });
    assert.equal(nextArg, undefined);
    assert.equal(res.body, undefined);
  });

  test('the role in the database wins over the (older) role in the token', async () => {
    dbUser = { userId: 4, role: 'lab_manager', active: true };
    const req = { user: { userId: 4, role: 'member', iat: 123 } };
    await run(requireActiveUser, req);
    assert.equal(req.user.role, 'lab_manager');
    assert.equal(req.user.iat, 123); // other token fields are kept
  });

  test('a demotion takes effect immediately', async () => {
    dbUser = { userId: 4, role: 'member', active: true };
    const req = { user: { userId: 4, role: 'lab_manager' } };
    await run(requireActiveUser, req);
    const { res } = await run(requireRole('lab_manager'), req);
    assert.equal(res.statusCode, 403);
  });

  test('a deactivated account gets 403 "Account disabled"', async () => {
    dbUser = { userId: 4, role: 'ta', active: false };
    const { res, nextArg } = await run(requireActiveUser, { user: { userId: 4, role: 'ta' } });
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: 'Account disabled' });
    assert.equal(nextArg, 'not called');
  });

  test('a deleted user gets 401', async () => {
    dbUser = null;
    const { res } = await run(requireActiveUser, { user: { userId: 4, role: 'ta' } });
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'User no longer exists' });
  });

  test('a database failure is passed to the error handler, not swallowed', async () => {
    dbError = new Error('connection lost');
    const { res, nextArg } = await run(requireActiveUser, { user: { userId: 4, role: 'ta' } });
    assert.equal(nextArg, dbError);
    assert.equal(res.body, undefined);
  });
});
