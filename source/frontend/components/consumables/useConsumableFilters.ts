// components/consumables/useConsumableFilters.ts — the toolbar's filter state and the list it produces.
import { useMemo, useState } from 'react';
import { applyFilters, countStats, isFiltered, NO_FILTERS, type Filters, type StatusFilter } from '@/lib/consumableFilters';
import { unitsWith, type Consumable } from '@/lib/consumables';

export function useConsumableFilters(items: Consumable[]) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  const visible = useMemo(() => applyFilters(items, filters), [items, filters]);
  const stats = useMemo(() => countStats(items), [items]);
  const units = useMemo(() => unitsWith(items.map((c) => c.unit)), [items]);

  const update = (change: Partial<Filters>) => setFilters((f) => ({ ...f, ...change }));
  // the summary cards act as toggles: clicking the active one shows everything again
  const toggleStatus = (status: StatusFilter) => setFilters((f) => ({ ...f, status: f.status === status ? 'all' : status }));
  const clear = () => setFilters((f) => ({ ...NO_FILTERS, sort: f.sort }));

  return { filters, update, toggleStatus, clear, active: isFiltered(filters), visible, stats, units };
}
