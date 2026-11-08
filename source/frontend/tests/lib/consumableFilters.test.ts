import { describe, expect, test } from 'vitest';
import { applyFilters, countStats, isFiltered, NO_FILTERS, type Filters } from '@/lib/consumableFilters';
import type { Consumable } from '@/lib/consumables';

const TODAY = new Date('2026-11-08T10:00:00');

const item = (o: Partial<Consumable>): Consumable => ({
  consumableId: 0, name: '', description: null, unit: 'ml', currentStock: 100, reorderThreshold: 10,
  phValue: null, expiryDate: null, imageUrl: null, hazards: [], properties: [], ...o,
});

const items = [
  item({ consumableId: 1, name: 'Ethanol', description: 'for disinfection', expiryDate: '2027-06-01' }),
  item({ consumableId: 2, name: 'Agar', unit: 'g', currentStock: 5, expiryDate: '2026-11-20' }),
  item({ consumableId: 3, name: 'Petri dish', unit: 'pieces', currentStock: 0, expiryDate: '2026-10-01' }),
  item({ consumableId: 4, name: 'Water', unit: 'l' }),
];
const run = (f: Partial<Filters>) => applyFilters(items, { ...NO_FILTERS, ...f }, TODAY).map((c) => c.consumableId);

describe('applyFilters', () => {
  test('no filters: everything, sorted by name', () => {
    expect(run({})).toEqual([2, 1, 3, 4]);
  });

  test('search matches name or description, ignoring case', () => {
    expect(run({ query: 'AGAR' })).toEqual([2]);
    expect(run({ query: 'disinfect' })).toEqual([1]);
  });

  test('filters by unit and status', () => {
    expect(run({ unit: 'g' })).toEqual([2]);
    expect(run({ status: 'low' })).toEqual([2, 3]);
    expect(run({ status: 'soon' })).toEqual([2]);
    expect(run({ status: 'expired' })).toEqual([3]);
  });

  test('sorts by stock level relative to threshold, and by expiry with no-expiry last', () => {
    expect(run({ sort: 'stock' })).toEqual([3, 2, 1, 4]);
    expect(run({ sort: 'expiry' })).toEqual([3, 2, 1, 4]);
  });

  test('does not change the original array', () => {
    const before = items.map((c) => c.consumableId);
    run({ sort: 'stock' });
    expect(items.map((c) => c.consumableId)).toEqual(before);
  });
});

test('countStats', () => {
  expect(countStats(items, TODAY)).toEqual({ total: 4, low: 2, soon: 1, expired: 1 });
});

test('isFiltered ignores the sort order', () => {
  expect(isFiltered({ ...NO_FILTERS, sort: 'expiry' })).toBe(false);
  expect(isFiltered({ ...NO_FILTERS, unit: 'g' })).toBe(true);
});
