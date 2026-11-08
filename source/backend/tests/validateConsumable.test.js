// Run with: npm test   (node --test)
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateConsumableInput } = require('../utils/validateConsumable');

const valid = { name: 'Ethanol', unit: 'ml' };

test('accepts name + unit and fills defaults for the rest', () => {
  const r = validateConsumableInput(valid);
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, {
    name: 'Ethanol',
    unit: 'ml',
    currentStock: 0,
    reorderThreshold: 0,
    description: null,
    phValue: null,
    expiryDate: null,
    imageUrl: null,
    hazardIds: [],
    propertyIds: [],
  });
});

test('propertyIds follow the same rules as hazardIds', () => {
  assert.deepEqual(validateConsumableInput({ ...valid, propertyIds: [3, 3, 1] }).data.propertyIds, [3, 1]);
  assert.ok(validateConsumableInput({ ...valid, propertyIds: [-1] }).errors.propertyIds);
});

test('hazardIds: a list of positive whole numbers, duplicates dropped, null means none', () => {
  assert.deepEqual(validateConsumableInput({ ...valid, hazardIds: [2, 5, 2] }).data.hazardIds, [2, 5]);
  assert.deepEqual(validateConsumableInput({ hazardIds: null }, { partial: true }).data.hazardIds, []);
  for (const hazardIds of ['2,5', [0], [1.5], ['2']]) {
    assert.ok(validateConsumableInput({ ...valid, hazardIds }).errors.hazardIds);
  }
  assert.equal(validateConsumableInput({ currentStock: 1 }, { partial: true }).data.hazardIds, undefined);
});

test('trims text and turns blank optional fields into null', () => {
  const r = validateConsumableInput({ ...valid, name: '  Ethanol  ', description: '   ', imageUrl: '' });
  assert.equal(r.data.name, 'Ethanol');
  assert.equal(r.data.description, null);
  assert.equal(r.data.imageUrl, null);
});

test('accepts numbers sent as strings and converts the expiry date', () => {
  const r = validateConsumableInput({ ...valid, currentStock: '12.5', phValue: '7', expiryDate: '2027-03-15' });
  assert.equal(r.data.currentStock, 12.5);
  assert.equal(r.data.phValue, 7);
  assert.ok(r.data.expiryDate instanceof Date);
});

test('rejects a missing or non-object body', () => {
  for (const body of [{}, undefined, null, 'text']) {
    const r = validateConsumableInput(body);
    assert.equal(r.ok, false);
    assert.ok(r.errors.name && r.errors.unit);
    assert.equal(r.data, null);
  }
});

test('rejects each bad field with its own message', () => {
  const r = validateConsumableInput({
    name: 'x'.repeat(151),
    unit: 'bottle',
    currentStock: -1,
    reorderThreshold: 'lots',
    description: 'x'.repeat(251),
    phValue: 14.5,
    expiryDate: 'not a date',
    imageUrl: 'javascript:alert(1)',
  });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), [
    'currentStock', 'description', 'expiryDate', 'imageUrl', 'name', 'phValue', 'reorderThreshold', 'unit',
  ]);
});

test('pH 0 and 14 are allowed, and so are uploaded-photo paths', () => {
  assert.equal(validateConsumableInput({ ...valid, phValue: 0 }).ok, true);
  assert.equal(validateConsumableInput({ ...valid, phValue: 14 }).ok, true);
  assert.equal(validateConsumableInput({ ...valid, imageUrl: '/consumableImages/3/photo.png?v=1' }).ok, true);
});

test('rejects quantities that do not fit Decimal(10, 2)', () => {
  assert.equal(validateConsumableInput({ ...valid, currentStock: 100000000 }).ok, false);
});

test('partial (PUT) checks and returns only the fields that were sent', () => {
  const r = validateConsumableInput({ currentStock: 80 }, { partial: true });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, { currentStock: 80 });

  assert.equal(validateConsumableInput({ name: '' }, { partial: true }).ok, false);
  assert.equal(validateConsumableInput({ phValue: null }, { partial: true }).data.phValue, null);
});

test('extraUnits lets an old item keep its free-text unit', () => {
  assert.equal(validateConsumableInput({ unit: 'bottle' }, { partial: true }).ok, false);
  assert.equal(validateConsumableInput({ unit: 'bottle' }, { partial: true, extraUnits: ['bottle'] }).ok, true);
});
