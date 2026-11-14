// hooks/equipment/useEquipmentFilters.ts — search text, availability filter, sort and page, and the query they make.
import { useMemo, useState } from 'react';
import { PAGE_SIZE, type SortValue } from '@/lib/equipmentList';
import { useDebounced } from './useDebounced';

export function useEquipmentFilters() {
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortValue>('name');
  const [page, setPage] = useState(1);

  const q = useDebounced(search.trim());

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (q) params.set('q', q);
    if (onlyAvailable) params.set('available', 'true');
    if (sort !== 'name') params.set('sort', sort); // 'name' is the backend default
    return params.toString();
  }, [q, onlyAvailable, sort, page]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeSort(value: SortValue) {
    setSort(value);
    setPage(1);
  }

  function changeAvailability(value: boolean) {
    setOnlyAvailable(value);
    setPage(1);
  }

  /** a new item must not be hidden by a search or filter, so clear them and go back to the first page */
  function resetFilters() {
    setSearch('');
    setOnlyAvailable(false);
    setPage(1);
  }

  return { search, onlyAvailable, sort, page, q, query, setPage, changeSearch, changeSort, changeAvailability, resetFilters };
}

export type EquipmentFilters = ReturnType<typeof useEquipmentFilters>;