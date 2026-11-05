// components/ProfileForm.tsx
// The profile form shared by "Create profile" (/profile/setup, shown after the first login)
// and "Edit profile" (/profile/edit). State lives in components/profile/useProfileForm.ts.
'use client';

import { EditLayout } from '@/components/profile/EditLayout';
import { SetupLayout } from '@/components/profile/SetupLayout';
import { useProfileForm } from '@/components/profile/useProfileForm';

export function ProfileForm({ mode }: { mode: 'setup' | 'edit' }) {
  const form = useProfileForm(mode);
  const { user } = form;
  if (!user) return null;
  return mode === 'setup' ? <SetupLayout form={form} user={user} /> : <EditLayout form={form} user={user} />;
}
