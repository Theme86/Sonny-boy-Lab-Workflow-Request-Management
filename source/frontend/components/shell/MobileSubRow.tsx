// components/shell/MobileSubRow.tsx — on phones, the choices of an opened group appear as a second row under the tabs
// (a dropdown would be clipped by the scrolling tabs).
import Link from 'next/link';
import { isActive, type NavLink } from './navConfig';
import { pill } from './navStyles';

type Props = { links: NavLink[]; pathname: string; onNavigate: () => void };

export function MobileSubRow({ links, pathname, onNavigate }: Props) {
  if (links.length === 0) return null;
  return (
    <div className="flex gap-2 px-4 pb-3 md:hidden">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={pill(active, 'h-9')}>
            <Icon width={18} height={18} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
