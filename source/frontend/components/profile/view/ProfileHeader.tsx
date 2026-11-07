// components/profile/view/ProfileHeader.tsx — banner, photo, name, role badge.
import type { ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge, StatusBadge } from '@/components/RoleBadge';
import { imageUrl } from '@/lib/api';
import { ui } from '@/lib/ui';
import { fullName, type User } from '@/lib/users';

export function ProfileHeader({ user, action }: { user: User; action?: ReactNode }) {
  const banner = imageUrl(user.bannerUrl);
  return (
    <section className={`overflow-hidden ${ui.card}`}>
      <div
        className="h-28 bg-gradient-to-br from-[#c2d7fb] to-vl-accent-soft bg-cover bg-center sm:h-32 dark:from-vl-accent-soft dark:to-[#2a2f3a]"
        style={banner ? { backgroundImage: `url("${banner}")` } : undefined}
        role="img"
        aria-label="Profile banner"
      />
      <div className="px-6 pb-6">
        <Avatar user={user} size="xl" className="-mt-12 ring-4 ring-white sm:-mt-14 dark:ring-vl-surface" />
        <h2 className="mt-4 text-[22px] leading-7 break-words">{fullName(user)}</h2>
        <p className={`mt-1 text-sm break-all ${ui.muted}`}>{user.email}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RoleBadge role={user.role} />
          {!user.active && <StatusBadge active={false} />}
        </div>
        {user.department && <p className="mt-4 text-sm">{user.department}</p>}
        {action && <div className="mt-5 flex [&>*]:flex-1">{action}</div>}
      </div>
    </section>
  );
}
