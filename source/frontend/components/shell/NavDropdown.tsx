// components/shell/NavDropdown.tsx — a top-bar button with a small menu under it (desktop).
// Used for each NAV_GROUPS entry.
'use client';

import { useCallback, useRef, useState } from 'react';
import { ChevronRightIcon } from '@/components/icons';
import { isGroupActive, type NavGroup } from './navConfig';
import { NavDropdownMenu } from './NavDropdownMenu';
import { pill } from './navStyles';
import { useDismiss } from './useDismiss';

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

      {open && <NavDropdownMenu group={group} pathname={pathname} onNavigate={close} />}
    </div>
  );
}
