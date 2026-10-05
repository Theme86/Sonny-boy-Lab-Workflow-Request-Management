// Run with: npm test   (node --test)
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRequestInput } = require('../utils/validateRequest');

const valid = { type: 'ticket', title: 'Fix script', description: 'Plot script crashes on run' };

test('accepts a valid ticket and defaults priority to medium', () => {
  const r = validateRequestInput(valid);
  assert.equal(r.ok, true);
  assert.equal(r.data.priority, 'medium');
  assert.equal(r.data.equipmentId, null);
  assert.equal(r.data.access, null);
});

test('trims title and description', () => {
  const r = validateRequestInput({ ...valid, title: '  Fix script  ', description: '  Crashes on run  ' });
  assert.equal(r.data.title, 'Fix script');
  assert.equal(r.data.description, 'Crashes on run');
});

test('rejects missing / empty required fields', () => {
  const r = validateRequestInput({});
  assert.equal(r.ok, false);
  assert.ok(r.errors.type && r.errors.title && r.errors.description);
  assert.equal(validateRequestInput(undefined).ok, false);
  assert.equal(validateRequestInput(null).ok, false);
});

test('rejects whitespace-only title', () => {
  assert.ok(validateRequestInput({ ...valid, title: '    ' }).errors.title);
});

test('enforces length limits (DB columns: title 150, description 250)', () => {
  assert.ok(validateRequestInput({ ...valid, title: 'a'.repeat(151) }).errors.title);
  assert.ok(validateRequestInput({ ...valid, description: 'a'.repeat(251) }).errors.description);
  assert.equal(validateRequestInput({ ...valid, title: 'a'.repeat(150), description: 'a'.repeat(250) }).ok, true);
});

test('rejects unknown type and types owned by other endpoints', () => {
  assert.ok(validateRequestInput({ ...valid, type: 'hacking' }).errors.type);
  assert.ok(validateRequestInput({ ...valid, type: 'consumable_order' }).errors.type);
});

test('rejects invalid priority', () => {
  assert.ok(validateRequestInput({ ...valid, priority: 'asap' }).errors.priority);
  assert.equal(validateRequestInput({ ...valid, priority: 'urgent' }).data.priority, 'urgent');
});

test('maintenance: equipmentId optional, must be positive int', () => {
  const base = { ...valid, type: 'maintenance' };
  assert.equal(validateRequestInput(base).ok, true);
  assert.equal(validateRequestInput({ ...base, equipmentId: '7' }).data.equipmentId, 7);
  assert.ok(validateRequestInput({ ...base, equipmentId: -1 }).errors.equipmentId);
  assert.ok(validateRequestInput({ ...base, equipmentId: 'abc' }).errors.equipmentId);
});

test('ticket ignores equipmentId', () => {
  assert.equal(validateRequestInput({ ...valid, equipmentId: 5 }).data.equipmentId, null);
});

test('access_permission: resourceType required, expiry must be in the future', () => {
  const base = { ...valid, type: 'access_permission' };
  const now = new Date('2026-10-05T00:00:00Z');
  assert.ok(validateRequestInput(base, now).errors.resourceType);
  assert.ok(validateRequestInput({ ...base, resourceType: 'lab' }, now).errors.resourceType);
  assert.ok(validateRequestInput({ ...base, resourceType: 'room', expiresAt: '2026-01-01' }, now).errors.expiresAt);
  assert.ok(validateRequestInput({ ...base, resourceType: 'room', expiresAt: 'nope' }, now).errors.expiresAt);

  const ok = validateRequestInput({ ...base, resourceType: 'room', resourceId: '2', expiresAt: '2026-12-31' }, now);
  assert.equal(ok.ok, true);
  assert.equal(ok.data.access.resourceType, 'room');
  assert.equal(ok.data.access.resourceId, 2);
  assert.ok(ok.data.access.expiresAt instanceof Date);
});
