// Run with: npm test   (node --test)
const test = require('node:test');
const assert = require('node:assert/strict');
const { isLow, becameLow, lowStockMessage } = require('../utils/lowStock');

test('low means at or below the reorder threshold, including zero', () => {
  assert.equal(isLow({ currentStock: 201, reorderThreshold: 200 }), false);
  assert.equal(isLow({ currentStock: 200, reorderThreshold: 200 }), true);
  assert.equal(isLow({ currentStock: 0, reorderThreshold: 0 }), true);
});

test('works with Decimal values given as strings', () => {
  assert.equal(isLow({ currentStock: '150.00', reorderThreshold: '200.00' }), true);
});

test('becameLow is true only when going from normal to low', () => {
  const normal = { currentStock: 500, reorderThreshold: 200 };
  const low = { currentStock: 150, reorderThreshold: 200 };
  assert.equal(becameLow(normal, low), true);
  assert.equal(becameLow(low, { ...low, currentStock: 100 }), false); // already low
  assert.equal(becameLow(low, normal), false); // restocked
  assert.equal(becameLow(normal, { ...normal, reorderThreshold: 600 }), true); // threshold raised
});

test('message shows what is left, or that it is out', () => {
  assert.equal(
    lowStockMessage({ name: 'Hydrochloric Acid', unit: 'ml', currentStock: '150.00', reorderThreshold: '200.00' }),
    'Hydrochloric Acid is low on stock: 150 ml left (reorder at 200 ml)',
  );
  assert.equal(
    lowStockMessage({ name: 'Petri Dish', unit: 'pieces', currentStock: 0, reorderThreshold: 50 }),
    'Petri Dish is out of stock (reorder at 50 pieces)',
  );
});
