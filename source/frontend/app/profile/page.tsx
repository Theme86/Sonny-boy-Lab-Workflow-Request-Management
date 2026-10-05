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

      <ProfileChecklist />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">About your account</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>You sign in with your Google account ({user.email}). Your email can only be changed in Google.</li>
          <li>Your student / staff ID and phone number are only visible to you and the Lab Manager.</li>
          <li>Your role decides what you can do in the lab system. Only the Lab Manager can change roles.</li>
        </ul>
      </section>
    </div>
  );
}

/** Shows which optional profile details are still empty, with a shortcut to fill them in. */
function ProfileChecklist() {
  const { user } = useCurrentUser();
  if (!user) return null;

  const items = [
    { label: 'Profile photo', done: !!user.avatarUrl },
    { label: 'Student / staff ID', done: !!user.studentId },
    { label: 'Phone number', done: !!user.phone },
    { label: 'Faculty / department', done: !!user.department },
    { label: 'Short bio', done: !!user.bio },
  ];
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;
  const percent = Math.round((doneCount / items.length) * 100);

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Your profile is {percent}% complete</h2>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">Add the missing details so the lab team can reach you.</p>
        </div>
        <Link href="/profile/edit" className={buttonStyles.primary}>
          Complete profile
        </Link>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className={item.done ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-600 dark:text-zinc-400'}>
            <span aria-hidden className="mr-2">{item.done ? '✓' : '○'}</span>
            {item.label}
            <span className="sr-only">{item.done ? ' (done)' : ' (missing)'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
