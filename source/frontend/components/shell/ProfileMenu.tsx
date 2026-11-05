// components/shell/ProfileMenu.tsx — the avatar button in the top bar and its account panel
// (name, role, "Manage your profile", "Manage users" for lab managers, "Sign out").
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { GroupIcon } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { ui } from '@/lib/ui';
import { fullName, ROLE_LABELS } from '@/lib/users';
import { barFocus } from './navConfig';
import { useDismiss } from './useDismiss';

const PANEL = 'absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-vl-surface-2 p-2 text-vl-ink shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)]';
const ROW = `flex h-14 items-center gap-4 px-6 text-sm ${ui.hover} ${ui.focus}`;

const SignOutIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden className="text-vl-muted">
    <path d="M10.1 15.6 11.5 17l5-5-5-5-1.4 1.4 2.6 2.6H3v2h9.7zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
  </svg>
);

export function ProfileMenu() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  if (!user) return null;

  async function signOut() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Account: ${fullName(user)}`}
        className={`rounded-full p-1 hover:bg-vl-bar-hover ${barFocus}`}
      >
        <Avatar user={user} size="sm" />
      </button>
      {open && (
        <div role="dialog" aria-label="Account" className={PANEL}>
          <p className={`px-4 pt-3 text-center text-sm ${ui.muted}`}>{user.email}</p>
          <div className="flex flex-col items-center px-4 pt-4 pb-5">
            <Avatar user={user} size="lg" />
            <p className="mt-3 text-[22px]">Hi, {user.firstName || 'there'}!</p>
            <p className={`mt-0.5 text-sm ${ui.muted}`}>{ROLE_LABELS[user.role]}</p>
            {user.profileCompletedAt && (
              <Link href="/profile" onClick={close} className={`${ui.btnOutline} mt-4`}>
                Manage your profile
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl bg-vl-surface">
            {user.profileCompletedAt && user.role === 'lab_manager' && (
              <Link href="/users" onClick={close} className={ROW}>
                <GroupIcon className="text-vl-muted" />
                Manage users
              </Link>
            )}
            <button type="button" onClick={signOut} className={`${ROW} w-full text-left`}>
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
