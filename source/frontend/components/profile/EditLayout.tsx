// components/profile/EditLayout.tsx — "Edit profile": picture and banner on the left, sections on the right, a sticky save bar.
import Link from 'next/link';
import { ArrowBackIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';
import { BannerEditor } from './BannerEditor';
import { EditSections } from './EditSections';
import { Section } from './Field';
import { ErrorBanner } from './FieldGroups';
import { PhotoPicker } from './PhotoPicker';
import { SaveBar } from './SaveBar';
import type { ProfileFormState } from './useProfileForm';

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
          <EditSections form={form} user={user} />
          <ErrorBanner message={form.formError} />
        </div>
      </div>

      <SaveBar form={form} />
    </form>
  );
}
