// lib/consumableFilters.ts — search, filter, sort and the summary counts for the consumables list.
import { expiryStatus, stockStatus, type Consumable } from '@/lib/consumables';

export type StatusFilter = 'all' | 'low' | 'soon' | 'expired';
export type SortKey = 'name' | 'stock' | 'expiry';

export type Filters = { query: string; unit: string; status: StatusFilter; sort: SortKey };
export const NO_FILTERS: Filters = { query: '', unit: 'all', status: 'all', sort: 'name' };

export const isFiltered = (f: Filters) => f.query !== '' || f.unit !== 'all' || f.status !== 'all';

function matches(c: Consumable, f: Filters, today: Date) {
  const q = f.query.trim().toLowerCase();
  if (q && !`${c.name} ${c.description ?? ''}`.toLowerCase().includes(q)) return false;
  if (f.unit !== 'all' && c.unit !== f.unit) return false;
  if (f.status === 'low') return stockStatus(c) !== 'in';
  if (f.status === 'soon' || f.status === 'expired') return expiryStatus(c, today) === f.status;
  return true;
}

const NO_EXPIRY = '9999-12-31';
const COMPARE: Record<SortKey, (a: Consumable, b: Consumable) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  // lowest stock relative to its reorder threshold first
  stock: (a, b) => a.currentStock / (a.reorderThreshold || 1) - b.currentStock / (b.reorderThreshold || 1),
  expiry: (a, b) => (a.expiryDate ?? NO_EXPIRY).localeCompare(b.expiryDate ?? NO_EXPIRY),
};

export function applyFilters(items: Consumable[], f: Filters, today = new Date()): Consumable[] {
  return items.filter((c) => matches(c, f, today)).sort(COMPARE[f.sort]);
}

export function countStats(items: Consumable[], today = new Date()) {
  return {
    total: items.length,
    low: items.filter((c) => stockStatus(c) !== 'in').length,
    soon: items.filter((c) => expiryStatus(c, today) === 'soon').length,
    expired: items.filter((c) => expiryStatus(c, today) === 'expired').length,
  };
}
