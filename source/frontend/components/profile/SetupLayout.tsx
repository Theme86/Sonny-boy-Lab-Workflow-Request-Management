// components/profile/SetupLayout.tsx — "Create profile": intro + photo on the left, form on the right.
import { VaseMark } from '@/components/icons';
import { ui } from '@/lib/ui';
import { ROLE_LABELS, type User } from '@/lib/users';
import { BioField, ErrorBanner, LabFields, NameFields } from './FieldGroups';
import { PhotoPicker } from './PhotoPicker';
import type { ProfileFormState } from './useProfileForm';

export function SetupLayout({ form, user }: { form: ProfileFormState; user: User }) {
  return (
    <form onSubmit={form.onSubmit} noValidate className={`mx-auto grid max-w-[1000px] overflow-hidden md:grid-cols-[340px_minmax(0,1fr)] ${ui.card}`}>
      <div className="bg-vl-surface-2 px-6 py-8 sm:px-8 sm:py-10">
        <VaseMark width={32} height={32} className="text-vl-accent" />
        <h1 className="mt-5 text-[28px] leading-9">Create your profile</h1>
        <p className={`mt-2 text-base ${ui.muted}`}>
          Tell the lab team who you are. Only your name is required; you can change everything later.
        </p>
        <p className="mt-5 inline-flex max-w-full rounded-full bg-vl-surface/70 px-3 py-1 text-sm break-all dark:bg-white/10">
          {user.email} ({ROLE_LABELS[user.role]})
        </p>
        <div className="mt-8">
          <PhotoPicker form={form} />
        </div>
      </div>

      <div className="flex flex-col px-6 py-8 sm:px-10 sm:py-10">
        <div className="space-y-6">
          <NameFields form={form} />
          <LabFields form={form} />
          <BioField form={form} />
          <p className={`text-xs ${ui.muted}`}>Your student / staff ID and phone number are only visible to you and the Lab Manager.</p>
          <ErrorBanner message={form.formError} />
        </div>
        <div className="mt-8 flex justify-end">
          <button type="submit" className={ui.btnPrimary} disabled={form.saving}>
            {form.saving ? 'Creating…' : 'Create profile'}
          </button>
        </div>
      </div>
    </form>
  );
}
