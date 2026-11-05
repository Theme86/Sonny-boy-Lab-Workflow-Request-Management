// components/users/UserCells.tsx — the pieces a user row is made of (used by both the phone cards and the table).
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { ui } from '@/lib/ui';
import { fullName, ROLE_LABELS, ROLES, type Role, type User } from '@/lib/users';

export type RowActions = {
  me: User;
  busyId: number | null;
  updateRole: (u: User, role: Role) => void;
  toggleActive: (u: User) => void;
};

export function NameBlock({ user, isMe }: { user: User; isMe: boolean }) {
  const extra = [user.studentId, user.department].filter(Boolean).join(', ');
  return (
    <Link href={`/users/${user.userId}`} className={`flex min-w-0 items-center gap-3 rounded-lg ${ui.focus}`}>
      <Avatar user={user} size="md" />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium hover:underline">
          {fullName(user)}
          {isMe && <span className={`ml-1 text-sm font-normal ${ui.muted}`}>(you)</span>}
        </span>
        <span className={`block truncate text-xs ${ui.muted}`}>{user.email}</span>
        {extra && <span className={`block truncate text-xs ${ui.muted}`}>{extra}</span>}
      </span>
    </Link>
  );
}

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

export function ActiveButton({ user, actions }: { user: User; actions: RowActions }) {
  if (user.userId === actions.me.userId) return null;
  return (
    <button
      type="button"
      onClick={() => actions.toggleActive(user)}
      disabled={actions.busyId === user.userId}
      className={user.active ? ui.btnDanger : `${ui.btnText} h-9`}
    >
      {user.active ? 'Deactivate' : 'Reactivate'}
    </button>
  );
}
