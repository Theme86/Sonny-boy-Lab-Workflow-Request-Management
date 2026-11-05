// components/profile/FieldGroups.tsx — the name, ID / contact and "About" inputs of the profile form.
import { ui } from '@/lib/ui';
import { PROFILE_LIMITS, type ProfileFields } from '@/lib/users';
import { Field } from './Field';
import type { ProfileFormState } from './useProfileForm';

type FormProps = { form: ProfileFormState };
type Options = { placeholder?: string; autoComplete?: string; required?: boolean; type?: string; digitsOnly?: boolean };

const LIMIT: Record<string, number> = {
  firstName: PROFILE_LIMITS.name,
  lastName: PROFILE_LIMITS.name,
  studentId: PROFILE_LIMITS.studentId,
  phone: PROFILE_LIMITS.phone,
  department: PROFILE_LIMITS.department,
};

function TextField({ form, name, label, options = {} }: FormProps & { name: keyof ProfileFields; label: string; options?: Options }) {
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

export function NameFields({ form }: FormProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <TextField form={form} name="firstName" label="First name" options={{ autoComplete: 'given-name', required: true }} />
      <TextField form={form} name="lastName" label="Last name" options={{ autoComplete: 'family-name', required: true }} />
    </div>
  );
}

export function LabFields({ form }: FormProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <TextField form={form} name="studentId" label="Student / staff ID" options={{ placeholder: '6710545725', digitsOnly: true }} />
      <TextField form={form} name="phone" label="Phone number" options={{ placeholder: '081 234 5678', autoComplete: 'tel', type: 'tel' }} />
      <div className="sm:col-span-2">
        <TextField form={form} name="department" label="Faculty / department" options={{ placeholder: 'Software and Knowledge Engineering' }} />
      </div>
    </div>
  );
}

export function BioField({ form }: FormProps) {
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

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
      {message}
    </p>
  );
}
