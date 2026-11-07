// app/users/page.tsx — user management for the Lab Manager (US-09)
// View all users, search, filter, sort by registered time / email / role, change role, (de)activate.
// The list itself lives in components/users/.
'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { UserManagement } from '@/components/users/UserManagement';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ui } from '@/lib/ui';

export default function UsersPage() {
  return (
    <AppShell>
      <UsersGate />
    </AppShell>
  );
}

function UsersGate() {
  const { user } = useCurrentUser();
  if (!user) return null;
  if (user.role !== 'lab_manager') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-[22px]">You don&apos;t have access to this page</h1>
        <p className={`mt-2 text-sm ${ui.muted}`}>Only the Lab Manager can manage users.</p>
        <Link href="/profile" className={`${ui.btnOutline} mt-6`}>
          Go to personal info
        </Link>
      </div>
    );
  }
  return <UserManagement me={user} />;
}
