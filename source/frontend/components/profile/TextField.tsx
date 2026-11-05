// components/profile/TextField.tsx — one labelled text input of the profile form, wired to the form state.
import { ui } from '@/lib/ui';
import { PROFILE_LIMITS, type ProfileFields } from '@/lib/users';
import { Field } from './Field';
import type { ProfileFormState } from './useProfileForm'

type Options = { placeholder?: string; autoComplete?: string; required?: boolean; type?: string; digitsOnly?: boolean };

const LIMIT: Record<string, number> = {
  firstName: PROFILE_LIMITS.name,
  lastName: PROFILE_LIMITS.name,
  studentId: PROFILE_LIMITS.studentId,
  phone: PROFILE_LIMITS.phone,
  department: PROFILE_LIMITS.department,
};

export function TextField({ form, name, label, options = {} }: { form: ProfileFormState } & { name: keyof ProfileFields; label: string; options?: Options }) {
  const error = form.errors[name];
  return (
    <Field label={label} required={options.required} error={error}>
      <input
        type={options.type ?? 'text'}
        value={form.fields[name]}
        onChange={(e) => form.setField(name, options.digitsOnly ? e.target.value.replace(/\D/g, '') : e.target.value)}
        inputMode={options.digitsOnly ? 'numeric' : undefined}
        maxLength={LIMIT[name]}
        placeholder={options.placeholder}
        autoComplete={options.autoComplete}
        className={`${ui.input} ${error ? ui.inputError : ''}`}
        aria-invalid={!!error}
      />
    </Field>
  );
}
