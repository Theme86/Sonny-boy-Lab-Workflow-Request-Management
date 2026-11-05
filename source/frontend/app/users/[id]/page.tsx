// app/users/[id]/page.tsx — view another user's profile
'use client';

import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { UserProfile } from '@/components/profile/view/UserProfile';

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  return (
    <AppShell>
      <UserProfile id={params.id} />
    </AppShell>
  );
}
