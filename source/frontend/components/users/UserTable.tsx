// components/users/UserTable.tsx — tablets and up: a table that fits the screen (no sideways scrolling).
import { StatusBadge } from '@/components/RoleBadge';
import { ui } from '@/lib/ui';
import { formatDate, type User } from '@/lib/users';
import { ActiveButton, NameBlock, RoleSelect, type RowActions } from './UserCells';
import type { SortKey } from './useUserList';

type Sorting = { sort: SortKey; order: 'asc' | 'desc'; onSort: (key: SortKey) => void };

function SortHeader({ label, sortKey, sorting, className = '' }: { label: string; sortKey: SortKey; sorting: Sorting; className?: string }) {
  const active = sorting.sort === sortKey;
  const ariaSort = active ? (sorting.order === 'asc' ? 'ascending' : 'descending') : undefined;
  return (
    <th className={`px-4 py-3 font-medium ${className}`} aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => sorting.onSort(sortKey)}
        className={`inline-flex items-center gap-1 rounded ${ui.focus} ${active ? 'text-vl-ink' : 'hover:text-vl-ink'}`}
      >
        {label}
        <span aria-hidden className={active ? '' : 'invisible'}>
          {sorting.order === 'asc' ? '↑' : '↓'}
        </span>
      </button>
    </th>
  );
}

function UserRow({ user: u, actions }: { user: User; actions: RowActions }) {
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

export function UserTable({ users, loading, sorting, actions }: { users: User[]; loading: boolean; sorting: Sorting; actions: RowActions }) {
  return (
    <table className="hidden w-full table-auto text-left text-sm md:table">
      <thead className={ui.muted}>
        <tr className={`border-b ${ui.border}`}>
          <SortHeader label="Name" sortKey="name" sorting={sorting} />
          <SortHeader label="Role" sortKey="role" sorting={sorting} />
          <SortHeader label="Registered" sortKey="createdAt" sorting={sorting} className="hidden 2xl:table-cell" />
          <SortHeader label="Last sign-in" sortKey="lastLoginAt" sorting={sorting} className="hidden xl:table-cell" />
          <th className="hidden px-4 py-3 font-medium lg:table-cell">Status</th>
          <th className="px-4 py-3">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className={loading ? 'opacity-60' : ''}>
        {users.map((u) => (
          <UserRow key={u.userId} user={u} actions={actions} />
        ))}
      </tbody>
    </table>
  );
}
