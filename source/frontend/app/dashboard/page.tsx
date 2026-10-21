// app/dashboard/page.tsx — Home inside the app (the public landing page at / links here):
// a starting point that links to each part of the lab system.
'use client';

import Link from 'next/link';
import { AppShell, NAV_ITEMS } from '@/components/AppShell';
import { ChevronRightIcon } from '@/components/icons';
import { PageHeading } from '@/components/ProfileView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ui } from '@/lib/ui';

const DESCRIPTIONS: Record<string, string> = {
  '/requests': 'Submit maintenance, access and order requests and follow their status.',
  '/consumables': 'Check chemical and supply stock, and order what is running low.',
  '/equipment': 'Browse lab equipment, see what is available and reserve it.',
};

export default function DashboardPage() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}

function Home() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return (
    <div>
      <PageHeading title={`Welcome, ${user.firstName || 'there'}`} subtitle="Where would you like to go?" />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {NAV_ITEMS.filter((item) => item.href !== '/dashboard').map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`${ui.card} ${ui.focus} group flex h-full items-start gap-4 p-5 transition-shadow hover:shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] dark:hover:ring-[#5f6368]`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]">
                <Icon width={22} height={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium">{label}</span>
                <span className={`mt-1 block text-sm ${ui.muted}`}>{DESCRIPTIONS[href]}</span>
              </span>
              <ChevronRightIcon className={`mt-2.5 shrink-0 ${ui.muted} transition-transform group-hover:translate-x-0.5`} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
