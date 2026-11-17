const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { checkEnv, assertEnv } = require('../utils/checkEnv');

const good = {
  JWT_SECRET: 'a-long-random-secret-123', GOOGLE_CLIENT_ID: 'id.apps.googleusercontent.com',
  DATABASE_HOST: 'localhost', DATABASE_PORT: '3306', DATABASE_USER: 'u', DATABASE_PASSWORD: 'p', DATABASE_NAME: 'd',
};

describe('checkEnv', () => {
  test('a complete setting list has nothing missing and no warnings', () => {
    assert.deepEqual(checkEnv(good), { missing: [], warnings: [] });
  });

  test('lists every missing name, treating blank values as missing', () => {
    const { missing } = checkEnv({ ...good, JWT_SECRET: '', GOOGLE_CLIENT_ID: '   ', DATABASE_NAME: undefined });
    assert.deepEqual(missing.sort(), ['DATABASE_NAME', 'GOOGLE_CLIENT_ID', 'JWT_SECRET']);
  });

  test('an empty database password is allowed, a missing one is not', () => {
    assert.deepEqual(checkEnv({ ...good, DATABASE_PASSWORD: '' }).missing, []);
    const { DATABASE_PASSWORD, ...without } = good;
    assert.deepEqual(checkEnv(without).missing, ['DATABASE_PASSWORD']);
  });

  test('warns about a short secret and a missing FRONTEND_URL in production', () => {
    const { warnings } = checkEnv({ ...good, JWT_SECRET: 'short', NODE_ENV: 'production' });
    assert.equal(warnings.length, 2);
  });
});

describe('assertEnv', () => {
  test('exits with code 1 when something is missing, and not otherwise', () => {
    const codes = [];
    const quiet = console.error; console.error = () => {};
    assertEnv({ ...good, JWT_SECRET: '' }, (c) => codes.push(c));
    assertEnv(good, (c) => codes.push(c));
    console.error = quiet;
    assert.deepEqual(codes, [1]);
  });
});