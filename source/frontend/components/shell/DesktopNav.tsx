// components/shell/DesktopNav.tsx — medium screens and up: navigation buttons in the top bar.
import Link from 'next/link';
import { isActive, pill, type NavGroup, type NavLink } from './navConfig';
import { NavDropdown } from './NavDropdown';

type Props = { links: NavLink[]; groups: NavGroup[]; pathname: string };

export function DesktopNav({ links, groups, pathname }: Props) {
  return (
    <nav aria-label="Main" className="ml-4 hidden md:block lg:ml-8">
      <ul className="flex items-center gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? 'page' : undefined} className={pill(active)}>
                <Icon className={active ? '' : 'text-vl-on-bar-muted'} />
                {label}
              </Link>
            </li>
          );
        })}
        {groups.map((group) => (
          <li key={group.key}>
            <NavDropdown group={group} pathname={pathname} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
