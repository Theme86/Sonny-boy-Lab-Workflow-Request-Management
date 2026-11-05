// components/users/UserManagement.tsx — the Lab Manager's user list: filters, phone cards / table, paging, notice.
'use client';

import { PageHeading } from '@/components/ProfileView';
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';
import { UserCards } from './UserCards';
import { UserFilters } from './UserFilters';
import { UserPager } from './UserPager';
import { UserTable } from './UserTable';
import { useUserActions } from './useUserActions';
import { useUserList } from './useUserList';

const EMPTY = `px-4 py-16 text-center text-sm ${ui.muted}`;

export function UserManagement({ me }: { me: User }) {
  const list = useUserList();
  const { notice, dismissNotice, busyId, updateRole, toggleActive } = useUserActions(list.replaceUser);
  const { data, loading, error, filters } = list;
  const actions = { me, busyId, updateRole, toggleActive };
  const sorting = { sort: list.sort, order: list.order, onSort: list.sortBy };

  return (
    <div>
      <PageHeading
        title="Users"
        subtitle="Everyone who has signed in to the lab system. Give new lecturers and TAs their role here."
      />

      <div className={`overflow-hidden ${ui.card}`}>
        <UserFilters {...filters} onSearch={list.changeSearch} onRole={list.changeRole} onStatus={list.changeStatus} />

        {error && (
          <p role="alert" className="m-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
            {error}
          </p>
        )}

        <UserCards users={data?.users ?? []} loading={loading} actions={actions} />
        <UserTable users={data?.users ?? []} loading={loading} sorting={sorting} actions={actions} />

        {data && data.users.length === 0 && <p className={EMPTY}>No users match your search. Try a different name or clear the filters.</p>}
        {!data && loading && <p className={EMPTY}>Loading users…</p>}
        {data && data.total > 0 && <UserPager data={data} page={list.page} loading={loading} onPage={list.setPage} />}
      </div>

      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded bg-[#313131] py-3.5 pr-2 pl-4 text-sm text-[#f2f2f2] shadow-lg sm:left-6 sm:translate-x-0 dark:bg-vl-ink dark:text-[#313131]"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={dismissNotice}
            className="rounded px-3 py-1.5 font-medium text-[#a8c7fa] hover:bg-white/10 dark:text-[#1558b0] dark:hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
