// components/users/UserRow.tsx — one person in the table (tablets and up).
import { StatusBadge } from '@/components/RoleBadge';
import { ui } from '@/lib/ui';
import { formatDate, type User } from '@/lib/users';
import { ActiveButton } from './ActiveButton';
import { NameBlock } from './NameBlock';
import { RoleSelect } from './RoleSelect';
import type { RowActions } from './rowActions';

export function UserRow({ user: u, actions }: { user: User; actions: RowActions }) {
  return (
    <tr className={`border-b last:border-b-0 ${ui.border} hover:bg-vl-hover`}>
      <td className="w-full max-w-0 px-4 py-3">
        <NameBlock user={u} isMe={u.userId === actions.me.userId} />
        <p className={`mt-1 pl-[52px] text-xs xl:hidden ${ui.muted}`}>
          Last sign-in {formatDate(u.lastLoginAt)}
          {!u.active && ' · Deactivated'}
        </p>
      </td>
      <td className="px-4 py-3">
        <RoleSelect user={u} actions={actions} className="w-44" />
      </td>
      <td className={`hidden px-4 py-3 whitespace-nowrap 2xl:table-cell ${ui.muted}`}>{formatDate(u.createdAt)}</td>
      <td className={`hidden px-4 py-3 whitespace-nowrap xl:table-cell ${ui.muted}`}>{formatDate(u.lastLoginAt, true)}</td>
      <td className="hidden px-4 py-3 whitespace-nowrap lg:table-cell">
        <StatusBadge active={u.active} />
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <ActiveButton user={u} actions={actions} />
      </td>
    </tr>
  );
}
