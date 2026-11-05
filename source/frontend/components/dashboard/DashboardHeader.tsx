// components/dashboard/DashboardHeader.tsx — greeting in the login page's serif, with the role and today's date.
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
    <header className="mb-8">
      <p className={`text-xs tracking-[0.12em] uppercase ${ui.muted}`} style={{ fontFamily: monoFamily }}>
        {formatDay(now.toISOString())}
      </p>
      <h1 className="mt-2 font-serif text-[32px] leading-tight sm:text-[36px]">
        {greeting(now)}, {firstName || 'there'}
      </h1>
      <div className="mt-3">
        <RoleBadge role={role} />
      </div>
    </header>
  );
}
