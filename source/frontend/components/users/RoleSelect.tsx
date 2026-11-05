// components/users/RoleSelect.tsx — the role dropdown of a user row (disabled for yourself).
import { ui } from '@/lib/ui';
import { fullName, ROLE_LABELS, ROLES, type Role, type User } from '@/lib/users';
import type { RowActions } from './rowActions';

export function RoleSelect({ user, actions, className = '' }: { user: User; actions: RowActions; className?: string }) {
  const isMe = user.userId === actions.me.userId;
  return (
    <select
      value={user.role}
      onChange={(e) => actions.updateRole(user, e.target.value as Role)}
      disabled={isMe || actions.busyId === user.userId}
      title={isMe ? "You can't change your own role" : undefined}
      className={`${ui.select} h-9 ${className}`}
      aria-label={`Role for ${fullName(user)}`}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}
