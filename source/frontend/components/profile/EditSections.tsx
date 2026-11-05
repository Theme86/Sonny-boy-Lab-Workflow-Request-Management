// components/profile/EditSections.tsx — the "Basic info" and "Contact info and ID" cards of the edit page.
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';
import { Field, Section } from './Field';
import { BioField, LabFields, NameFields } from './FieldGroups';
import type { ProfileFormState } from './useProfileForm';

export function EditSections({ form, user }: { form: ProfileFormState; user: User }) {
  return (
    <>
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
    </>
  );
}
