// components/profile/BioField.tsx — the "About" textarea with its character counter.
import { ui } from '@/lib/ui';
import { PROFILE_LIMITS } from '@/lib/users';
import { Field } from './Field';
import type { ProfileFormState } from './useProfileForm';

export function BioField({ form }: { form: ProfileFormState }) {
  const error = form.errors.bio;
  return (
    <Field label="About" error={error} hint={`${form.fields.bio.trim().length} / ${PROFILE_LIMITS.bio}`}>
      <textarea
        value={form.fields.bio}
        onChange={(e) => form.setField('bio', e.target.value)}
        maxLength={PROFILE_LIMITS.bio}
        rows={4}
        placeholder="What you work on in the lab"
        className={`${ui.input} resize-y ${error ? ui.inputError : ''}`}
        aria-invalid={!!error}
      />
    </Field>
  );
}
