// components/users/UserCards.tsx — phones: one card per person.
import { StatusBadge } from '@/components/RoleBadge';
import { ui } from '@/lib/ui';
import { formatDate, type User } from '@/lib/users';
import { ActiveButton, NameBlock, RoleSelect, type RowActions } from './UserCells';

export function UserCards({ users, loading, actions }: { users: User[]; loading: boolean; actions: RowActions }) {
  return (
    <ul className={`md:hidden ${loading ? 'opacity-60' : ''}`}>
      {users.map((u) => (
        <li key={u.userId} className={`border-b px-4 py-4 last:border-b-0 ${ui.border}`}>
          <NameBlock user={u} isMe={u.userId === actions.me.userId} />
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <RoleSelect user={u} actions={actions} className="min-w-0 flex-1" />
            <StatusBadge active={u.active} />
            <ActiveButton user={u} actions={actions} />
          </div>
          <p className={`mt-2 text-xs ${ui.muted}`}>
            Registered {formatDate(u.createdAt)}, last sign-in {formatDate(u.lastLoginAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
