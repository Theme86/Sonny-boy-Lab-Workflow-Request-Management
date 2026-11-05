// components/users/userChanges.ts — what changing a role / (de)activating a person asks, sends and says afterwards.
import { apiFetch } from '@/lib/api';
import { fullName, ROLE_LABELS, type Role, type User } from '@/lib/users';

export type Change = { question: string; request: () => Promise<User>; done: (u: User) => string; failed: string };

export const roleChange = (target: User, role: Role): Change => ({
  question: `Change ${fullName(target)} from ${ROLE_LABELS[target.role]} to ${ROLE_LABELS[role]}?`,
  request: () => apiFetch<User>(`/api/users/${target.userId}/role`, { method: 'PATCH', json: { role } }),
  done: (u) => `${fullName(u)} is now ${ROLE_LABELS[u.role]}`,
  failed: 'The role could not be changed',
});

export const activeChange = (target: User): Change => {
  const active = !target.active;
  return {
    question: active
      ? `Reactivate ${fullName(target)}? They will be able to sign in again.`
      : `Deactivate ${fullName(target)}? They won't be able to sign in until you reactivate them.`,
    request: () => apiFetch<User>(`/api/users/${target.userId}/active`, { method: 'PATCH', json: { active } }),
    done: (u) => `${fullName(u)} ${u.active ? 'reactivated' : 'deactivated'}`,
    failed: 'The account could not be updated',
  };
};
