// app/users/[id]/page.tsx — view another user's profile
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { ArrowBackIcon } from '@/components/icons';
import { ProfileDetails, ProfileHeader, ProfileLayout } from '@/components/ProfileView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { ui } from '@/lib/ui';
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

  const backHref = me?.role === 'lab_manager' ? '/users' : '/profile';
  const backLabel = me?.role === 'lab_manager' ? 'Users' : 'Personal info';

  const back = (
    <Link href={backHref} className={`mb-6 inline-flex items-center gap-2 rounded-full py-2 pr-4 pl-2 text-sm ${ui.hover} ${ui.focus}`}>
      <ArrowBackIcon />
      {backLabel}
    </Link>
  );

  if (result?.id !== params.id) {
    return <p className={`py-16 text-center text-sm ${ui.muted}`}>Loading profile…</p>;
  }

  const { user, error } = result;
  if (error || !user) {
    return (
      <div>
        {back}
        <div className="py-16 text-center">
          <h1 className="text-[22px]">This profile isn&apos;t available</h1>
          <p className={`mt-2 text-sm ${ui.muted}`}>{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  const isMe = me?.userId === user.userId;

  return (
    <div>
      {back}
      <ProfileLayout
        left={
          <ProfileHeader
            user={user}
            action={
              isMe ? (
                <Link href="/profile/edit" className={ui.btnPrimary}>
                  Edit profile
                </Link>
              ) : undefined
            }
          />
        }
      >
        <ProfileDetails user={user} editable={isMe} />
      </ProfileLayout>
    </div>
  );
}
