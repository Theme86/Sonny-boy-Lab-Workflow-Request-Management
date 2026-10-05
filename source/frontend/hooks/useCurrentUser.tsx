// hooks/useCurrentUser.tsx
// Loads the logged-in user's full profile once and shares it with every page inside <AppShell>.
'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import type { User } from '@/lib/users';

type CurrentUserContextValue = {
  user: User | null;
  loading: boolean;
  error: string;
  setUser: (user: User) => void;
  reload: () => Promise<void>;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Used by the "Try again" button. (The first load below does its own fetch so that
  // state is only set inside promise callbacks, not synchronously inside the effect.)
  const reload = useCallback(async () => {
    try {
      setUser(await apiFetch<User>('/api/users/me'));
      setError('');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<User>('/api/users/me')
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <CurrentUserContext.Provider value={{ user, loading, error, setUser, reload }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used inside <CurrentUserProvider> (AppShell)');
  return ctx;
}
