// components/profile/view/UserProfile.tsx — another person's profile (or your own, with an "Edit profile" button).
'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ui } from '@/lib/ui';
import { BackLink } from './BackLink';
import { ProfileDetails } from './ProfileDetails';
import { ProfileHeader } from './ProfileHeader';
import { ProfileLayout } from './ProfileLayout';
import { useUserById } from './useUserById';

export function UserProfile({ id }: { id: string }) {
  const { user: me } = useCurrentUser();
  const result = useUserById(id);

  if (result.loading) return <p className={`py-16 text-center text-sm ${ui.muted}`}>Loading profile…</p>;

  const { user, error } = result;
  if (error || !user) {
    return (
      <div>
        <BackLink me={me} />
        <div className="py-16 text-center">
          <h1 className="text-[22px]">This profile isn&apos;t available</h1>
          <p className={`mt-2 text-sm ${ui.muted}`}>{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  const isMe = me?.userId === user.userId;
  const edit = isMe ? (
    <Link href="/profile/edit" className={ui.btnPrimary}>
      Edit profile
    </Link>
  ) : undefined;

  return (
    <div>
      <BackLink me={me} />
      <ProfileLayout left={<ProfileHeader user={user} action={edit} />}>
        <ProfileDetails user={user} editable={isMe} />
      </ProfileLayout>
    </div>
  );
}
