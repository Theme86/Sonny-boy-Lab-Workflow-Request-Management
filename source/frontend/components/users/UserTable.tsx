// components/users/UserTable.tsx — tablets and up: a table that fits the screen (no sideways scrolling).
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';
import type { RowActions } from './rowActions';
import { SortHeader, type Sorting } from './SortHeader';
import { UserRow } from './UserRow';

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
