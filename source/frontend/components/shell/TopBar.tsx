// components/shell/TopBar.tsx — the sticky bar: logo, main navigation, light/dark toggle, account menu.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VaseMark } from '@/components/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { NAV_GROUPS, NAV_ITEMS, ungrouped } from './navConfig';
import { barFocus } from './navStyles';
import { ProfileMenu } from './ProfileMenu';

export function TopBar() {
  const { user } = useCurrentUser();
  const pathname = usePathname();

  // no navigation until the profile is created
  const hasNav = !!user?.profileCompletedAt;
  const links = hasNav ? ungrouped(NAV_ITEMS) : [];
  const groups = hasNav ? NAV_GROUPS : [];

  return (
    <header className="sticky top-0 z-20 bg-vl-bar text-vl-on-bar">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className={`flex shrink-0 items-center gap-2 rounded ${barFocus}`}>
          <VaseMark width={26} height={26} className="text-vl-on-bar" />
          <span className="text-[22px] leading-none font-semibold tracking-tight text-vl-on-bar">Vase Lab</span>
        </Link>
        {hasNav && <DesktopNav links={links} groups={groups} pathname={pathname} />}
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          {user && <ProfileMenu />}
        </div>
      </div>
      {hasNav && <MobileNav links={links} groups={groups} pathname={pathname} />}
    </header>
  );
}
