// components/AppShell.tsx
// Wraps logged-in pages: loads the current user (redirects to /login if not signed in),
// sends new users to "Create profile", and draws the top bar with the main navigation
// (Home, Requests ▾ [Requests, Lab sessions], Items ▾ [Equipment, Consumables]),
// the light/dark toggle and the account menu.
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import {
  ChevronRightIcon,
  FlaskIcon,
  GroupIcon,
  HomeIcon,
  MicroscopeIcon,
  RequestIcon,
  VaseMark,
} from '@/components/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CurrentUserProvider, useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { fontStyle, fontVariables } from '@/lib/fonts';
import { ui } from '@/lib/ui';
import { fullName, ROLE_LABELS } from '@/lib/users';

const SETUP_PATH = '/profile/setup';

type IconType = ComponentType<{ width?: number; height?: number; className?: string }>;
type NavLink = { href: string; label: string; icon: IconType };
type NavGroup = { key: string; label: string; icon: IconType; links: NavLink[] };

// Not in your icon set yet, so it lives here. Move it to components/icons if you prefer.
function CalendarIcon({ width = 24, height = 24, className }: { width?: number; height?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" aria-hidden className={className}>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className={`flex min-h-screen flex-1 flex-col ${ui.page} ${fontVariables}`} style={fontStyle}>
        <TopBar />
        <main className="w-full min-w-0 flex-1 px-4 pt-5 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1680px]">
            <ShellContent>{children}</ShellContent>
          </div>
        </main>
      </div>
    </CurrentUserProvider>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-24" role="status">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#dadce0] border-t-[#1558b0] dark:border-[#3c4043] dark:border-t-[#a8c7fa]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const { user, loading, error, reload } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  // New users must finish "Create profile" first; finished users can't reopen it.
  const needsSetup = !!user && !user.profileCompletedAt;
  const onSetupPage = pathname === SETUP_PATH;
  const redirectTo = needsSetup && !onSetupPage ? SETUP_PATH : !needsSetup && onSetupPage && user ? '/profile' : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (loading || redirectTo) return <Spinner />;
  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-[22px]">Can&apos;t load your profile</h1>
        <p className={`mt-2 text-sm ${ui.muted}`}>{error}. Check that the backend is running, then try again.</p>
        <button type="button" onClick={() => reload()} className={`${ui.btnOutline} mt-6`}>
          Try again
        </button>
      </div>
    );
  }
  if (!user) return null; // redirecting to /login
  return <>{children}</>;
}

// Flat list: still used by the dashboard cards (add a '/sessions' line to its DESCRIPTIONS).
export const NAV_ITEMS: NavLink[] = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/requests', label: 'Requests', icon: RequestIcon },
  { href: '/labsessions', label: 'Lab sessions', icon: CalendarIcon },
  { href: '/consumables', label: 'Consumables', icon: FlaskIcon },
  { href: '/equipment', label: 'Equipment', icon: MicroscopeIcon },
  { href: '/rooms', label: 'Rooms', icon: RequestIcon },
];

const byHref = (href: string) => NAV_ITEMS.find((i) => i.href === href)!;

// Top bar menus. Change a group's `label` to rename its button.
const NAV_GROUPS: NavGroup[] = [
  { key: 'requests', label: 'Requests', icon: RequestIcon, links: [byHref('/requests'), byHref('/labsessions')] },
  { key: 'items', label: 'Items', icon: MicroscopeIcon, links: [byHref('/equipment'), byHref('/consumables'), byHref('/rooms')] },
];

const GROUPED_HREFS = new Set(NAV_GROUPS.flatMap((g) => g.links.map((l) => l.href)));

function useNavItems() {
  const { user } = useCurrentUser();
  if (!user?.profileCompletedAt) return []; // no navigation until the profile is created
  return NAV_ITEMS;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const isGroupActive = (pathname: string, group: NavGroup) =>
  group.links.some((l) => isActive(pathname, l.href));

function TopBar() {
  const { user } = useCurrentUser();
  const items = useNavItems();
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null); // small screens only

  // anything not inside a group keeps its own button
  const links = items.filter((i) => !GROUPED_HREFS.has(i.href));
  const groups = items.length > 0 ? NAV_GROUPS : [];
  const openLinks = groups.find((g) => g.key === openGroup)?.links ?? [];

  return (
    <header className={`sticky top-0 z-20 border-b ${ui.surface} ${ui.border}`}>
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className={`flex shrink-0 items-center gap-2 rounded ${ui.focus}`}>
          <VaseMark width={26} height={26} className="text-[#1558b0] dark:text-[#a8c7fa]" />
          <span className="text-[22px] leading-none text-[#444746] dark:text-[#e3e3e3]">Vase Lab</span>
        </Link>

        {/* medium screens and up: navigation buttons in the bar */}
        {items.length > 0 && (
          <nav aria-label="Main" className="ml-4 hidden md:block lg:ml-8">
            <ul className="flex items-center gap-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors ${ui.focus} ${
                        active
                          ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                          : `${ui.hover} text-[#444746] dark:text-[#c4c7c5]`
                      }`}
                    >
                      <Icon className={active ? '' : 'text-[#5f6368] dark:text-[#9aa0a6]'} />
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
        )}

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          {user && <ProfileMenu />}
        </div>
      </div>

      {/* small screens: navigation as a scrollable row of tabs under the bar */}
      {items.length > 0 && (
        <>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-2 md:hidden">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpenGroup(null)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 border-b-[3px] px-3 py-3 text-sm font-medium whitespace-nowrap ${ui.focus} ${
                    active
                      ? 'border-[#1558b0] text-[#1558b0] dark:border-[#a8c7fa] dark:text-[#a8c7fa]'
                      : `border-transparent ${ui.muted}`
                  }`}
                >
                  <Icon width={18} height={18} />
                  {label}
                </Link>
              );
            })}
            {groups.map((group) => {
              const active = isGroupActive(pathname, group);
              const open = openGroup === group.key;
              const Icon = group.icon;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setOpenGroup(open ? null : group.key)}
                  aria-expanded={open}
                  className={`flex items-center gap-2 border-b-[3px] px-3 py-3 text-sm font-medium whitespace-nowrap ${ui.focus} ${
                    active
                      ? 'border-[#1558b0] text-[#1558b0] dark:border-[#a8c7fa] dark:text-[#a8c7fa]'
                      : `border-transparent ${ui.muted}`
                  }`}
                >
                  <Icon width={18} height={18} />
                  {group.label}
                  <ChevronRightIcon
                    width={16}
                    height={16}
                    className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
                  />
                </button>
              );
            })}
          </nav>

          {/* the choices open as a second row (a dropdown would be clipped by the scrolling tabs) */}
          {openLinks.length > 0 && (
            <div className="flex gap-2 px-4 pb-3 md:hidden">
              {openLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpenGroup(null)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium ${ui.focus} ${
                      active
                        ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                        : `${ui.hover} text-[#444746] dark:text-[#c4c7c5]`
                    }`}
                  >
                    <Icon width={18} height={18} />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </header>
  );
}

// A top-bar button with a small menu under it (desktop). Used for each NAV_GROUPS entry.
function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = isGroupActive(pathname, group);
  const Icon = group.icon;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors ${ui.focus} ${
          active
            ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]'
            : `${ui.hover} text-[#444746] dark:text-[#c4c7c5]`
        }`}
      >
        <Icon className={active ? '' : 'text-[#5f6368] dark:text-[#9aa0a6]'} />
        {group.label}
        <ChevronRightIcon
          width={16}
          height={16}
          className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={group.label}
          className="absolute left-0 mt-2 w-52 overflow-hidden rounded-2xl bg-white p-1 shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)] dark:bg-[#282a2c]"
        >
          {group.links.map(({ href, label, icon: LinkIcon }) => {
            const current = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                aria-current={current ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm ${ui.hover} ${ui.focus} ${
                  current ? 'font-medium text-[#1558b0] dark:text-[#a8c7fa]' : ''
                }`}
              >
                <LinkIcon className="text-[#5f6368] dark:text-[#9aa0a6]" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  async function signOut() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Account: ${fullName(user)}`}
        className={`rounded-full p-1 ${ui.hover} ${ui.focus}`}
      >
        <Avatar user={user} size="sm" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-[#e9eef6] p-2 shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)] dark:bg-[#282a2c]"
        >
          <p className={`px-4 pt-3 text-center text-sm ${ui.muted}`}>{user.email}</p>
          <div className="flex flex-col items-center px-4 pt-4 pb-5">
            <Avatar user={user} size="lg" />
            <p className="mt-3 text-[22px]">Hi, {user.firstName || 'there'}!</p>
            <p className={`mt-0.5 text-sm ${ui.muted}`}>{ROLE_LABELS[user.role]}</p>
            {user.profileCompletedAt && (
              <Link href="/profile" onClick={() => setOpen(false)} className={`${ui.btnOutline} mt-4`}>
                Manage your profile
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#1f1f1f]">
            {user.profileCompletedAt && user.role === 'lab_manager' && (
              <Link
                href="/users"
                onClick={() => setOpen(false)}
                className={`flex h-14 items-center gap-4 px-6 text-sm ${ui.hover} ${ui.focus}`}
              >
                <GroupIcon className="text-[#5f6368] dark:text-[#9aa0a6]" />
                Manage users
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              className={`flex h-14 w-full items-center gap-4 px-6 text-left text-sm ${ui.hover} ${ui.focus}`}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden className="text-[#5f6368] dark:text-[#9aa0a6]">
                <path d="M10.1 15.6 11.5 17l5-5-5-5-1.4 1.4 2.6 2.6H3v2h9.7zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}