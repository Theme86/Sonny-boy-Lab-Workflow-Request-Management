// components/AppShell.tsx
// Wraps logged-in pages: loads the current user (redirects to /login if not signed in)
// and shows the top bar with the profile menu.
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { CurrentUserProvider, useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { fullName, ROLE_LABELS } from '@/lib/users';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <TopBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <ShellContent>{children}</ShellContent>
        </main>
      </div>
    </CurrentUserProvider>
  );
}

const SETUP_PATH = '/profile/setup';

function Spinner() {
  return (
    <div className="flex justify-center py-24" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
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
      <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
        <button
          type="button"
          onClick={() => reload()}
          className="mt-4 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-800 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-900 dark:text-red-100 dark:ring-red-800"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!user) return null; // redirecting to /login
  return <>{children}</>;
}

function TopBar() {
  const { user } = useCurrentUser();
  const pathname = usePathname();

  // hide navigation until the profile has been created
  const links = !user?.profileCompletedAt
    ? []
    : [
        { href: '/profile', label: 'My profile' },
        ...(user.role === 'lab_manager' ? [{ href: '/users', label: 'Users' }] : []),
      ];

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link href="/profile" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">V</span>
          <span className="hidden sm:inline">Vase Lab</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">{user && <ProfileMenu />}</div>
      </div>
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

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  }

  const itemClass =
    'block w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-40 truncate text-sm font-medium text-zinc-800 sm:inline dark:text-zinc-100">
          {user.firstName || user.email}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{fullName(user)}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <Link href="/profile" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            View profile
          </Link>
          <Link href="/profile/edit" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            Edit profile
          </Link>
          {user.role === 'lab_manager' && (
            <Link href="/users" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              Manage users
            </Link>
          )}
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <button type="button" role="menuitem" onClick={logout} className={`${itemClass} text-red-600 dark:text-red-400`}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
