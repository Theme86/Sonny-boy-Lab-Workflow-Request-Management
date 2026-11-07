// components/profile/view/useUserById.ts — loads one user by id; "loading" is when the result belongs to another id.
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/users';

type Result = { id: string; user?: User; error?: string } | null;

export function useUserById(id: string) {
  const [result, setResult] = useState<Result>(null);
  useEffect(() => {
    let cancelled = false;
    apiFetch<User>(`/api/users/${encodeURIComponent(id)}`)
      .then((user) => !cancelled && setResult({ id, user }))
      .catch((err) => !cancelled && setResult({ id, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);
  return result?.id === id ? { loading: false as const, user: result.user, error: result.error } : { loading: true as const };
}
