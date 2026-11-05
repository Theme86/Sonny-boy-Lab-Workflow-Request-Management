// components/dashboard/DashboardHeader.tsx — greeting in the login page's serif, the role and today's date,
// with the two things people come here to do most on the right.
import Link from 'next/link';
import { RoleBadge } from '@/components/RoleBadge';
import { formatDay, greeting } from '@/lib/dashboardTime';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';
import type { Role } from '@/lib/users';

interface DashboardHeaderProps {
  firstName: string;
  role: Role;
  now?: Date;
}

export function DashboardHeader({ firstName, role, now = new Date() }: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div>
        <p className={`flex items-center gap-3 text-xs tracking-[0.12em] uppercase ${ui.muted}`} style={{ fontFamily: monoFamily }}>
          {formatDay(now.toISOString())}
          <RoleBadge role={role} />
        </p>
        <h1 className="mt-2 font-serif text-[32px] leading-tight sm:text-[40px]">
          {greeting(now)}, {firstName || 'there'}
        </h1>
      </div>
      <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
        <Link href="/labsessions/new" className={`${ui.btnOutline} bg-white dark:bg-transparent`}>
          Book a session
        </Link>
        <Link href="/requests/new" className={ui.btnPrimary}>
          New request
        </Link>
      </nav>
    </header>
  );
}
