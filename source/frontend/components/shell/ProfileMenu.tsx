// components/shell/ProfileMenu.tsx — the avatar button in the top bar and its account panel
// (name, role, "Manage your profile", "Manage users" for lab managers, "Sign out").
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { fullName } from '@/lib/users';
import { barFocus } from './navStyles';
import { ProfileMenuPanel } from './ProfileMenuPanel';
import { useDismiss } from './useDismiss';

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
      {open && <ProfileMenuPanel user={user} onClose={close} onSignOut={signOut} />}
    </div>
  );
}
