// app/profile/setup/page.tsx — "Create profile", shown once after the first login.
// <AppShell> sends anyone whose profile isn't finished here, and sends finished users away.
'use client';

import { AppShell } from '@/components/AppShell';
import { ProfileForm } from '@/components/ProfileForm';

export default function CreateProfilePage() {
  return (
    <AppShell>
      <ProfileForm mode="setup" />
    </AppShell>
  );
}
