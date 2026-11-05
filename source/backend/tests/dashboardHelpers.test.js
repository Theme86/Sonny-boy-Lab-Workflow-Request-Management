const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('../services/dashboard/helpers');
const { attentionAccess, hasAttention } = require('../services/dashboard/access');

const NOW = new Date('2026-11-05T12:00:00Z');
const inDays = (n) => new Date(NOW.getTime() + n * 86400000);

test('countByStatus gives a zero for every status and ignores unknown ones', () => {
  const counts = h.countByStatus([
    { status: 'open', _count: { _all: 3 } },
    { status: 'blocked', _count: { _all: 1 } },
    { status: 'mystery', _count: { _all: 9 } },
  ]);
  assert.equal(counts.open, 3);
  assert.equal(counts.blocked, 1);
  assert.equal(counts.completed, 0);
  assert.equal('mystery' in counts, false);
  assert.deepEqual(Object.keys(counts), h.REQUEST_STATUSES);
});

test('activeTotal adds only the statuses someone still works on', () => {
  const counts = h.countByStatus([
    { status: 'open', _count: { _all: 2 } },
    { status: 'in_progress', _count: { _all: 1 } },
    { status: 'completed', _count: { _all: 10 } },
    { status: 'rejected', _count: { _all: 4 } },
  ]);
  assert.equal(h.activeTotal(counts), 3);
});

test('toNumber converts Decimal-like values and keeps null', () => {
  assert.equal(h.toNumber({ toString: () => '2.5', valueOf: () => 2.5 }), 2.5);
  assert.equal(h.toNumber('7'), 7);
  assert.equal(h.toNumber(null), null);
});

test('isLowStock is true at or under the reorder level', () => {
  assert.equal(h.isLowStock({ currentStock: 5, reorderThreshold: 5 }), true);
  assert.equal(h.isLowStock({ currentStock: 4, reorderThreshold: 5 }), true);
  assert.equal(h.isLowStock({ currentStock: 6, reorderThreshold: 5 }), false);
  assert.equal(h.isLowStock({ currentStock: 0, reorderThreshold: 0 }), true);
  assert.equal(h.isLowStock({ currentStock: 1, reorderThreshold: 0 }), false);
});

test('daysUntil rounds up and goes negative after the date', () => {
  assert.equal(h.daysUntil(inDays(10), NOW), 10);
  assert.equal(h.daysUntil(new Date(NOW.getTime() + 3600000), NOW), 1);
  assert.equal(h.daysUntil(inDays(-2), NOW), -2);
});

test('expiryState: expired, soon, or nothing', () => {
  assert.equal(h.expiryState(null, NOW), null);
  assert.equal(h.expiryState(inDays(-1), NOW), 'expired');
  assert.equal(h.expiryState(NOW, NOW), 'expired');
  assert.equal(h.expiryState(inDays(30), NOW), 'soon');
  assert.equal(h.expiryState(inDays(31), NOW), null);
});

test('byStockRatio puts the emptiest first and byExpiry the soonest first', () => {
  const items = [
    { currentStock: 5, reorderThreshold: 10 },
    { currentStock: 0, reorderThreshold: 10 },
    { currentStock: 8, reorderThreshold: 10 },
  ];
  assert.deepEqual(items.sort(h.byStockRatio).map((i) => i.currentStock), [0, 5, 8]);
  assert.deepEqual([{ daysLeft: 5 }, { daysLeft: -3 }].sort(h.byExpiry), [{ daysLeft: -3 }, { daysLeft: 5 }]);
});

test('limited keeps the total but trims the list', () => {
  assert.deepEqual(h.limited([1, 2, 3], 2), { total: 3, items: [1, 2] });
  assert.deepEqual(h.limited([], 2), { total: 0, items: [] });
});

test('attentionAccess follows who can act on what', () => {
  assert.deepEqual(attentionAccess('member'), { requests: false, pendingSessions: false, newMembers: false });
  assert.deepEqual(attentionAccess('ta'), { requests: true, pendingSessions: false, newMembers: false });
  assert.deepEqual(attentionAccess('lecturer'), { requests: true, pendingSessions: true, newMembers: false });
  assert.deepEqual(attentionAccess('lab_manager'), { requests: true, pendingSessions: true, newMembers: true });
  assert.equal(hasAttention('member'), false);
  assert.equal(hasAttention('ta'), true);
});
