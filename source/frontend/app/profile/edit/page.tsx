// app/profile/edit/page.tsx — edit my profile
'use client';

import { AppShell } from '@/components/AppShell';
import { ProfileForm } from '@/components/ProfileForm';

export default function EditProfilePage() {
  return (
    <AppShell>
      <ProfileForm mode="edit" />
    </AppShell>
  );
}
