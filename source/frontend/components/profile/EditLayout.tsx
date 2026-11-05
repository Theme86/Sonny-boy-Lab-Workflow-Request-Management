// components/profile/EditLayout.tsx — "Edit profile": picture and banner on the left, sections on the right, a sticky save bar.
import Link from 'next/link';
import { ArrowBackIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';
import { BannerEditor } from './BannerEditor';
import { Field, Section } from './Field';
import { BioField, ErrorBanner, LabFields, NameFields } from './FieldGroups';
import { PhotoPicker } from './PhotoPicker';
import type { ProfileFormState } from './useProfileForm';

function SaveBar({ form }: { form: ProfileFormState }) {
  const justSaved = form.saved && !form.hasChanges;
  return (
    <div className={`sticky bottom-4 z-10 mt-6 flex items-center justify-end gap-2 px-5 py-3 ${ui.card}`}>
      {justSaved && (
        <span role="status" className={`mr-auto text-sm ${ui.muted}`}>
          Changes saved
        </span>
      )}
      <Link href="/profile" className={ui.btnText}>
        {justSaved ? 'Done' : 'Cancel'}
      </Link>
      <button type="submit" className={ui.btnPrimary} disabled={form.saving || !form.hasChanges}>
        {form.saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

export function EditLayout({ form, user }: { form: ProfileFormState; user: User }) {
  return (
    <form onSubmit={form.onSubmit} noValidate>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/profile" aria-label="Back to personal info" className={`rounded-full p-2 ${ui.hover} ${ui.focus}`}>
          <ArrowBackIcon />
        </Link>
        <h1 className="text-[28px] leading-9">Edit profile</h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <Section title="Profile picture and banner" className="lg:sticky lg:top-20">
          <PhotoPicker form={form} />
          <div className="mt-6">
            <BannerEditor form={form} />
          </div>
        </Section>

        <div className="space-y-6">
          <Section title="Basic info" description="Other people in the lab can see this information.">
            <div className="space-y-5">
              <NameFields form={form} />
              <Field label="Email" hint="Managed by your Google account.">
                <input value={user.email} disabled className={ui.input} />
              </Field>
              <BioField form={form} />
            </div>
          </Section>

          <Section title="Contact info and ID" description="Only you and the Lab Manager can see your student / staff ID and phone number.">
            <LabFields form={form} />
          </Section>

          <ErrorBanner message={form.formError} />
        </div>
      </div>

      <SaveBar form={form} />
    </form>
  );
}
