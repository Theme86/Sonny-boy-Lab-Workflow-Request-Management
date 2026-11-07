// components/shell/ProfileMenuPanel.tsx — the account panel: name, role, "Manage your profile", "Manage users", "Sign out".
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { GroupIcon } from '@/components/icons';
import { SignOutIcon } from './SignOutIcon';
import { ui } from '@/lib/ui';
import { ROLE_LABELS, type User } from '@/lib/users';

const PANEL = 'absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-vl-surface-2 p-2 text-vl-ink shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)]';
const ROW = `flex h-14 items-center gap-4 px-6 text-sm ${ui.hover} ${ui.focus}`;

type Props = { user: User; onClose: () => void; onSignOut: () => void };

export function ProfileMenuPanel({ user, onClose, onSignOut }: Props) {
  return (
    <div role="dialog" aria-label="Account" className={PANEL}>
      <p className={`px-4 pt-3 text-center text-sm ${ui.muted}`}>{user.email}</p>
      <div className="flex flex-col items-center px-4 pt-4 pb-5">
        <Avatar user={user} size="lg" />
        <p className="mt-3 text-[22px]">Hi, {user.firstName || 'there'}!</p>
        <p className={`mt-0.5 text-sm ${ui.muted}`}>{ROLE_LABELS[user.role]}</p>
        {user.profileCompletedAt && (
          <Link href="/profile" onClick={onClose} className={`${ui.btnOutline} mt-4`}>
            Manage your profile
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl bg-vl-surface">
        {user.profileCompletedAt && user.role === 'lab_manager' && (
          <Link href="/users" onClick={onClose} className={ROW}>
            <GroupIcon className="text-vl-muted" />
            Manage users
          </Link>
        )}
        <button type="button" onClick={onSignOut} className={`${ROW} w-full text-left`}>
          <SignOutIcon />
          Sign out
        </button>
      </div>
    </div>
  );
}
