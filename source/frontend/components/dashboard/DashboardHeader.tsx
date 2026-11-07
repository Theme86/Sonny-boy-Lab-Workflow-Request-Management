// components/dashboard/DashboardHeader.tsx — what today is, who you are here, and the two things people come to do.
import Link from 'next/link';
import { formatLongDay } from '@/lib/dashboardTime';
import { dash } from '@/lib/dashboardUi';
import { ROLE_LABELS, type Role } from '@/lib/users';

export function DashboardHeader({ role, now = new Date() }: { role: Role; now?: Date }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h1 className={dash.title}>Today</h1>
        <p className={`mt-0.5 text-sm ${dash.muted}`}>
          {formatLongDay(now)} · {ROLE_LABELS[role]}
        </p>
      </div>
      <nav aria-label="Quick actions" className="flex gap-2">
        <Link href="/requests/new" className={dash.btnSecondary}>
          New request
        </Link>
        <Link href="/labsessions/new" className={dash.btnPrimary}>
          Book a session
        </Link>
      </nav>
    </header>
  );
}
