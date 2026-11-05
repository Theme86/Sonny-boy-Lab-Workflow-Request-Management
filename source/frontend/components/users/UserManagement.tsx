// components/users/UserManagement.tsx — the Lab Manager's user list: filters, phone cards / table, paging, notice.
'use client';

import { PageHeading } from '@/components/ProfileView';
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';
import { ErrorAlert } from './ErrorAlert';
import { ListMessage } from './ListMessage';
import { Notice } from './Notice';
import { UserCards } from './UserCards';
import { UserFilters } from './UserFilters';
import { UserPager } from './UserPager';
import { UserTable } from './UserTable';
import { useUserActions } from './useUserActions';
import { useUserList } from './useUserList';

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

        {error && <ErrorAlert message={error} />}

        <UserCards users={data?.users ?? []} loading={loading} actions={actions} />
        <UserTable users={data?.users ?? []} loading={loading} sorting={sorting} actions={actions} />

        <ListMessage data={data} loading={loading} />
        {data && data.total > 0 && <UserPager data={data} page={list.page} loading={loading} onPage={list.setPage} />}
      </div>

      {notice && <Notice message={notice} onDismiss={dismissNotice} />}
    </div>
  );
}
