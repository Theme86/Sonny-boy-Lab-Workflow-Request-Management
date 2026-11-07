// scripts/set-role.js is run as a real child process (it starts itself when loaded),
// with the database replaced by tests/support/stubPrisma.js.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'set-role.js');
const STUB = path.join(__dirname, 'support', 'stubPrisma.js');

function run(args, users = []) {
  const result = spawnSync(process.execPath, ['-r', STUB, SCRIPT, ...args], {
    env: { ...process.env, STUB_USERS: JSON.stringify(users) },
    encoding: 'utf8',
  });
  const calls = result.stdout
    .split('\n')
    .filter((l) => l.startsWith('CALL '))
    .map((l) => JSON.parse(l.slice(5)));
  const text = result.stdout
    .split('\n')
    .filter((l) => l && !l.startsWith('CALL '))
    .join('\n');
  return { status: result.status, stdout: text, stderr: result.stderr, calls };
}

const ada = { email: 'ada@ku.th', role: 'member' };

describe('set-role usage errors', () => {
  test('no arguments: usage, exit 1, database untouched', () => {
    const r = run([]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Usage: npm run set-role -- <email> <member\|ta\|lecturer\|lab_manager>/);
    assert.deepEqual(r.calls.filter((c) => c.update), []);
  });

  test('email without a role', () => {
    const r = run(['ada@ku.th'], [ada]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Usage/);
  });

  test('an invalid role is refused, so a typo cannot lock someone out', () => {
    const r = run(['ada@ku.th', 'admin'], [ada]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Usage/);
    assert.deepEqual(r.calls.filter((c) => c.update), []);
  });
});

describe('set-role', () => {
  test('unknown email: tells the person to sign in once first, exit 1', () => {
    const r = run(['nobody@ku.th', 'lab_manager'], [ada]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /No user with email nobody@ku\.th/);
    assert.match(r.stderr, /Sign in with Google once first/);
    assert.deepEqual(r.calls.filter((c) => c.update), []);
  });

  test('updates the role of exactly that user and reports old -> new', () => {
    const r = run(['ada@ku.th', 'lab_manager'], [ada, { email: 'bob@ku.th', role: 'member' }]);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), 'ada@ku.th: member -> lab_manager');
    assert.deepEqual(r.calls.filter((c) => c.update), [{ update: { where: { email: 'ada@ku.th' }, data: { role: 'lab_manager' } } }]);
  });

  for (const role of ['member', 'ta', 'lecturer', 'lab_manager']) {
    test(`accepts the role "${role}"`, () => {
      const r = run(['ada@ku.th', role], [{ email: 'ada@ku.th', role: 'ta' }]);
      assert.equal(r.status, 0);
      assert.equal(r.stdout.trim(), `ada@ku.th: ta -> ${role}`);
    });
  }

  test('the database connection is closed after a successful change', () => {
    assert.ok(run(['ada@ku.th', 'ta'], [ada]).calls.some((c) => c.disconnect));
  });
});
