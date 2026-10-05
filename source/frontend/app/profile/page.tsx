// app/profile/page.tsx — my profile
'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { buttonStyles, ProfileCard } from '@/components/ProfileCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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
    <div className="space-y-6">
      <ProfileCard
        user={user}
        actions={
          <>
            <Link href="/profile/edit" className={buttonStyles.secondary}>
              Edit profile
            </Link>
            {user.role === 'lab_manager' && (
              <Link href="/users" className={buttonStyles.primary}>
                Manage users
              </Link>
            )}
          </>
        }
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">About your account</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>You sign in with your Google account ({user.email}). Your email can only be changed in Google.</li>
          <li>Your role decides what you can do in the lab system. Only the Lab Manager can change roles.</li>
        </ul>
      </section>
    </div>
  );
}
