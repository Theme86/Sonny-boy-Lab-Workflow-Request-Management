// app/users/[id]/page.tsx — view another user's profile
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { buttonStyles, ProfileCard } from '@/components/ProfileCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/users';

export default function UserProfilePage() {
  return (
    <AppShell>
      <UserProfile />
    </AppShell>
  );
}

function UserProfile() {
  const params = useParams<{ id: string }>();
  const { user: me } = useCurrentUser();
  // the result remembers which id it belongs to, so "loading" is simply "result is for another id"
  const [result, setResult] = useState<{ id: string; user?: User; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<User>(`/api/users/${encodeURIComponent(params.id)}`)
      .then((data) => !cancelled && setResult({ id: params.id, user: data }))
      .catch((err) => !cancelled && setResult({ id: params.id, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (result?.id !== params.id) return <p className="py-16 text-center text-sm text-zinc-500">Loading profile…</p>;
  const { user, error } = result;

  if (error || !user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{error || 'User not found'}</p>
        <Link href="/profile" className={`${buttonStyles.secondary} mt-6`}>
          Back to my profile
        </Link>
      </div>
    );
  }

  const isMe = me?.userId === user.userId;

  return (
    <div className="space-y-4">
      {me?.role === 'lab_manager' && (
        <Link href="/users" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← All users
        </Link>
      )}
      <ProfileCard
        user={user}
        actions={
          isMe ? (
            <Link href="/profile/edit" className={buttonStyles.secondary}>
              Edit profile
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
