// components/AppShell.tsx
// Wraps logged-in pages: loads the current user (redirects to /login if not signed in),
// sends new users to "Create profile", and draws the top bar + side navigation.
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { GroupIcon, PersonIcon, VaseMark } from '@/components/icons';
import { CurrentUserProvider, useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { fontStyle, fontVariables } from '@/lib/fonts';
import { ui } from '@/lib/ui';
import { fullName, ROLE_LABELS } from '@/lib/users';

const SETUP_PATH = '/profile/setup';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className={`flex min-h-screen flex-1 flex-col ${ui.page} ${fontVariables}`} style={fontStyle}>
        <TopBar />
        <div className="flex w-full flex-1">
          <SideNav />
          <main className="min-w-0 flex-1 px-4 pt-5 pb-16 sm:px-6 lg:pr-8 lg:pl-2">
            <div className="mx-auto w-full max-w-[1680px]">
              <ShellContent>{children}</ShellContent>
            </div>
          </main>
        </div>
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

function useNavItems() {
  const { user } = useCurrentUser();
  if (!user?.profileCompletedAt) return []; // no navigation until the profile is created
  return [
    { href: '/profile', label: 'Personal info', icon: PersonIcon },
    ...(user.role === 'lab_manager' ? [{ href: '/users', label: 'Users', icon: GroupIcon }] : []),
  ];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SideNav() {
  const items = useNavItems();
  const pathname = usePathname();
  if (items.length === 0) return null;

  return (
    <nav aria-label="Main" className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 px-3 pt-3 lg:block">
      <ul className="space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 items-center gap-4 rounded-full px-4 text-sm font-medium ${ui.focus} ${
                  active
                    ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                    : `${ui.hover} text-[#1f1f1f] dark:text-[#e3e3e3]`
                }`}
              >
                <Icon className={active ? '' : 'text-[#5f6368] dark:text-[#9aa0a6]'} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TopBar() {
  const { user } = useCurrentUser();
  const items = useNavItems();
  const pathname = usePathname();

  return (
    <header className={`sticky top-0 z-20 border-b lg:border-b-0 ${ui.surface} ${ui.border}`}>
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:pr-8">
        <Link href="/profile" className={`flex items-center gap-2 rounded ${ui.focus}`}>
          <VaseMark width={26} height={26} className="text-[#1558b0] dark:text-[#a8c7fa]" />
          <span className="text-[22px] leading-none text-[#444746] dark:text-[#e3e3e3]">Vase Lab</span>
        </Link>
        <div className="ml-auto">{user && <ProfileMenu />}</div>
      </div>

      {/* small screens: navigation as tabs */}
      {items.length > 1 && (
        <nav aria-label="Main" className="flex gap-1 px-2 lg:hidden">
          {items.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`border-b-[3px] px-4 py-3 text-sm font-medium whitespace-nowrap ${ui.focus} ${
                  active
                    ? 'border-[#1558b0] text-[#1558b0] dark:border-[#a8c7fa] dark:text-[#a8c7fa]'
                    : `border-transparent ${ui.muted}`
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
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
