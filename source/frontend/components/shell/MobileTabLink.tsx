// components/shell/MobileTabLink.tsx — one plain link in the phone tab row.
import Link from 'next/link';
import type { NavLink } from './navConfig';
import { tab } from './navStyles';

export function MobileTabLink({ link, active, onClick }: { link: NavLink; active: boolean; onClick: () => void }) {
  const Icon = link.icon;
  return (
    <Link href={link.href} onClick={onClick} aria-current={active ? 'page' : undefined} className={tab(active)}>
      <Icon width={18} height={18} />
      {link.label}
    </Link>
  );
}
