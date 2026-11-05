// components/users/useUserList.ts — the user list's search / filter / sort / paging state and the request that follows it.
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Role, User, UserListResponse } from '@/lib/users';

export type SortKey = 'createdAt' | 'lastLoginAt' | 'email' | 'role' | 'name';
export type StatusFilter = 'all' | 'active' | 'inactive';
export const PAGE_SIZE = 20;

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type Result = { key: string; data?: UserListResponse; error?: string } | null;

export function useUserList() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result>(null);

  const q = useDebounced(search.trim());

  const queryKey = useMemo(() => {
    const params = new URLSearchParams({ sort, order, status, page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    return params.toString();
  }, [q, role, status, sort, order, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<UserListResponse>(`/api/users?${queryKey}`)
      .then((data) => !cancelled && setResult({ key: queryKey, data }))
      .catch((err) => !cancelled && setResult({ key: queryKey, error: err.message ?? 'Users could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  const loading = result?.key !== queryKey;

  // changing a filter goes back to the first page
  const withFirstPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  function sortBy(key: SortKey) {
    if (key === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(key);
      setOrder(key === 'createdAt' || key === 'lastLoginAt' ? 'desc' : 'asc');
    }
    setPage(1);
  }

  function replaceUser(updated: User) {
    setResult((r) =>
      r?.data ? { ...r, data: { ...r.data, users: r.data.users.map((u) => (u.userId === updated.userId ? updated : u)) } } : r,
    );
  }

  return {
    filters: { search, role, status },
    changeSearch: withFirstPage(setSearch),
    changeRole: withFirstPage(setRole),
    changeStatus: withFirstPage(setStatus),
    sort,
    order,
    sortBy,
    page,
    setPage,
    data: result?.data ?? null, // keeps showing the previous page while the next one loads
    loading,
    error: loading ? '' : (result?.error ?? ''),
    replaceUser,
  };
}
