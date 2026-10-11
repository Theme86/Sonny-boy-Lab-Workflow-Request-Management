// app/profile/page.tsx — my profile ("Personal info")
'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeading, ProfileDetails, ProfileHeader, ProfileLayout } from '@/components/ProfileView';
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
    <div>
      <PageHeading title="Personal info" subtitle="Your profile in the lab system and the details the lab team uses to reach you." />
      <ProfileLayout
        left={
          <ProfileHeader
            user={user}
            action={
              <Link href="/profile/edit" className={ui.btnPrimary}>
                Edit profile
              </Link>
            }
          />
        }
      >
        <ProfileDetails user={user} editable />
        <p className={`mt-6 text-xs ${ui.muted}`}>
          You sign in with Google, so your email address can only be changed in your Google account.
        </p>
      </ProfileLayout>
    </div>
  );
}
