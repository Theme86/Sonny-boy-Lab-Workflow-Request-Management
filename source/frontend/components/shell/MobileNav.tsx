// components/shell/MobileNav.tsx — small screens: navigation as a scrollable row of tabs under the bar.
// A group's choices open as a second row (a dropdown would be clipped by the scrolling tabs).
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRightIcon } from '@/components/icons';
import { isActive, isGroupActive, pill, tab, type NavGroup, type NavLink } from './navConfig';

type Props = { links: NavLink[]; groups: NavGroup[]; pathname: string };

export function MobileNav({ links, groups, pathname }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const openLinks = groups.find((g) => g.key === openGroup)?.links ?? [];
  const close = () => setOpenGroup(null);

  return (
    <>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} onClick={close} aria-current={active ? 'page' : undefined} className={tab(active)}>
              <Icon width={18} height={18} />
              {label}
            </Link>
          );
        })}
        {groups.map((group) => {
          const open = openGroup === group.key;
          const Icon = group.icon;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => setOpenGroup(open ? null : group.key)}
              aria-expanded={open}
              className={tab(isGroupActive(pathname, group))}
            >
              <Icon width={18} height={18} />
              {group.label}
              <ChevronRightIcon width={16} height={16} className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
            </button>
          );
        })}
      </nav>

      {openLinks.length > 0 && (
        <div className="flex gap-2 px-4 pb-3 md:hidden">
          {openLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} onClick={close} aria-current={active ? 'page' : undefined} className={pill(active, 'h-9')}>
                <Icon width={18} height={18} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
