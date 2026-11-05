// components/users/useUserList.ts — the user list: the query state (useUserQuery) and the request that follows it.
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User, UserListResponse } from '@/lib/users';
import { useUserQuery } from './useUserQuery';

export { PAGE_SIZE, type SortKey, type StatusFilter } from './useUserQuery';

type Result = { key: string; data?: UserListResponse; error?: string } | null;

export function useUserList() {
  const query = useUserQuery();
  const { queryKey } = query;
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<UserListResponse>(`/api/users?${queryKey}`)
      .then((data) => !cancelled && setResult({ key: queryKey, data }))
      .catch((err) => !cancelled && setResult({ key: queryKey, error: err.message ?? 'Users could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  function replaceUser(updated: User) {
    setResult((r) =>
      r?.data ? { ...r, data: { ...r.data, users: r.data.users.map((u) => (u.userId === updated.userId ? updated : u)) } } : r,
    );
  }

  const loading = result?.key !== queryKey;
  return {
    ...query,
    data: result?.data ?? null, // keeps showing the previous page while the next one loads
    loading,
    error: loading ? '' : (result?.error ?? ''),
    replaceUser,
  };
}
