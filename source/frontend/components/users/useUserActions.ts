// components/users/useUserActions.ts — change a user's role or (de)activate them, with a confirm step and a short notice.
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { fullName, ROLE_LABELS, type Role, type User } from '@/lib/users';

export function useUserActions(replaceUser: (u: User) => void) {
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  // the notice disappears by itself after a few seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  async function run(target: User, request: () => Promise<User>, done: (u: User) => string, failed: string) {
    setBusyId(target.userId);
    try {
      const updated = await request();
      replaceUser(updated);
      setNotice(done(updated));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : failed);
    } finally {
      setBusyId(null);
    }
  }

  async function updateRole(target: User, newRole: Role) {
    if (newRole === target.role) return;
    if (!window.confirm(`Change ${fullName(target)} from ${ROLE_LABELS[target.role]} to ${ROLE_LABELS[newRole]}?`)) return;
    await run(
      target,
      () => apiFetch<User>(`/api/users/${target.userId}/role`, { method: 'PATCH', json: { role: newRole } }),
      (u) => `${fullName(u)} is now ${ROLE_LABELS[u.role]}`,
      'The role could not be changed',
    );
  }

  async function toggleActive(target: User) {
    const next = !target.active;
    const question = next
      ? `Reactivate ${fullName(target)}? They will be able to sign in again.`
      : `Deactivate ${fullName(target)}? They won't be able to sign in until you reactivate them.`;
    if (!window.confirm(question)) return;
    await run(
      target,
      () => apiFetch<User>(`/api/users/${target.userId}/active`, { method: 'PATCH', json: { active: next } }),
      (u) => `${fullName(u)} ${u.active ? 'reactivated' : 'deactivated'}`,
      'The account could not be updated',
    );
  }

  return { notice, dismissNotice: () => setNotice(''), busyId, updateRole, toggleActive };
}
