// components/users/useSorting.ts — which column the list is sorted by, and the direction; clicking a column toggles or switches it.
import { useState } from 'react';
import type { SortKey } from './useUserQuery';

export function useSorting(onChange: () => void) {
  const [sort, setSort] = useState<SortKey>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  function sortBy(key: SortKey) {
    if (key === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(key);
      setOrder(key === 'createdAt' || key === 'lastLoginAt' ? 'desc' : 'asc');
    }
    onChange();
  }

  return { sort, order, sortBy };
}
