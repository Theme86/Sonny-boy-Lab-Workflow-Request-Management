// components/shell/NavDropdownMenu.tsx — the small menu that opens under a top-bar dropdown button.
import Link from 'next/link';
import { ui } from '@/lib/ui';
import { isActive, type NavGroup } from './navConfig';

const MENU = 'absolute left-0 mt-2 w-52 overflow-hidden rounded-2xl bg-vl-surface p-1 text-vl-ink shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)] dark:bg-vl-surface-2';

export function NavDropdownMenu({ group, pathname, onNavigate }: { group: NavGroup; pathname: string; onNavigate: () => void }) {
  return (
    <div role="menu" aria-label={group.label} className={MENU}>
      {group.links.map(({ href, label, icon: LinkIcon }) => {
        const current = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            role="menuitem"
            onClick={onNavigate}
            aria-current={current ? 'page' : undefined}
            className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm ${ui.hover} ${ui.focus} ${current ? 'font-medium text-vl-accent' : ''}`}
          >
            <LinkIcon className="text-vl-muted" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
