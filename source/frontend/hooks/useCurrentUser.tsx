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

  const reload = useCallback(async () => {
    try {
      const me = await apiFetch<User>('/api/users/me');
      setUser(me);
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
    reload();
  }, [reload]);

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
