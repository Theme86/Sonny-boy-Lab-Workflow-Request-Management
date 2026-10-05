// app/profile/page.tsx — my profile ("Personal info")
'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeading, ProfileDetails, ProfileHeader } from '@/components/ProfileView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ui } from '@/lib/ui';

export default function ProfilePage() {
  return (
    <AppShell>
      <MyProfile />
    </AppShell>
  );
}

function MyProfile() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading title="Personal info" subtitle="Your profile in the lab system and the details the lab team uses to reach you." />
      <ProfileHeader
        user={user}
        action={
          <Link href="/profile/edit" className={ui.btnOutline}>
            Edit profile
          </Link>
        }
      />
      <ProfileDetails user={user} editable />
      <p className={`mt-6 text-center text-xs ${ui.muted}`}>
        You sign in with Google, so your email address can only be changed in your Google account.
      </p>
    </div>
  );
}
