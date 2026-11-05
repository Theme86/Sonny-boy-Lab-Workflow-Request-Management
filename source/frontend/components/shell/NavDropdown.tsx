// components/shell/NavDropdown.tsx — a top-bar button with a small menu under it (desktop).
// Used for each NAV_GROUPS entry.
'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { ChevronRightIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import { isActive, isGroupActive, pill, type NavGroup } from './navConfig';
import { useDismiss } from './useDismiss';

const MENU = 'absolute left-0 mt-2 w-52 overflow-hidden rounded-2xl bg-vl-surface p-1 text-vl-ink shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)] dark:bg-vl-surface-2';

export function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  const active = isGroupActive(pathname, group);
  const Icon = group.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={pill(active)}
      >
        <Icon className={active ? '' : 'text-vl-on-bar-muted'} />
        {group.label}
        <ChevronRightIcon width={16} height={16} className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      {open && (
        <div role="menu" aria-label={group.label} className={MENU}>
          {group.links.map(({ href, label, icon: LinkIcon }) => {
            const current = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={close}
                aria-current={current ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm ${ui.hover} ${ui.focus} ${current ? 'font-medium text-vl-accent' : ''}`}
              >
                <LinkIcon className="text-vl-muted" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
