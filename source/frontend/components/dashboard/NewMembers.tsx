// components/dashboard/NewMembers.tsx — "N new members joined this week" with a link to user management.
import Link from 'next/link';
import { dash } from '@/lib/dashboardUi';

export function NewMembers({ count }: { count: number }) {
  return (
    <p className={`text-sm ${dash.muted}`}>
      <span className={`font-medium text-inherit ${dash.num}`}>{count}</span> new {count === 1 ? 'member' : 'members'} joined this week.{' '}
      <Link href="/users" className={dash.link}>
        Manage users
      </Link>
    </p>
  );
}
