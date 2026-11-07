// components/users/useUserActions.ts — change a user's role or (de)activate them, with a confirm step and a short notice.
import { useState } from 'react';
import type { Role, User } from '@/lib/users';
import { activeChange, roleChange, type Change } from './userChanges';
import { useNotice } from './useNotice';

export function useUserActions(replaceUser: (u: User) => void) {
  const { notice, setNotice, dismissNotice } = useNotice();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function confirmAndRun(target: User, change: Change) {
    if (!window.confirm(change.question)) return;
    setBusyId(target.userId);
    try {
      const updated = await change.request();
      replaceUser(updated);
      setNotice(change.done(updated));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : change.failed);
    } finally {
      setBusyId(null);
    }
  }

  return {
    notice,
    dismissNotice,
    busyId,
    updateRole: (target: User, role: Role) => role !== target.role && confirmAndRun(target, roleChange(target, role)),
    toggleActive: (target: User) => confirmAndRun(target, activeChange(target)),
  };
}
