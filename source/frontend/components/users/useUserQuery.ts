// components/users/useUserQuery.ts — the user list's search / filter / sort / paging state, and the query string it makes.
import { useMemo, useState } from 'react';
import type { Role } from '@/lib/users';
import { useDebounced } from './useDebounced';
import { useSorting } from './useSorting';

export type SortKey = 'createdAt' | 'lastLoginAt' | 'email' | 'role' | 'name';
export type StatusFilter = 'all' | 'active' | 'inactive';
export const PAGE_SIZE = 20;

export function useUserQuery() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const { sort, order, sortBy } = useSorting(() => setPage(1));
  const q = useDebounced(search.trim());

  const queryKey = useMemo(() => {
    const params = new URLSearchParams({ sort, order, status, page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    return params.toString();
  }, [q, role, status, sort, order, page]);

  // changing a filter goes back to the first page
  const withFirstPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return {
    queryKey,
    filters: { search, role, status },
    changeSearch: withFirstPage(setSearch),
    changeRole: withFirstPage(setRole),
    changeStatus: withFirstPage(setStatus),
    sort,
    order,
    sortBy,
    page,
    setPage,
  };
}
