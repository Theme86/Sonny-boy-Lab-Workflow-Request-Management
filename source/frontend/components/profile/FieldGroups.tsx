// components/profile/FieldGroups.tsx — the name, ID / contact and "About" inputs of the profile form.
import { TextField } from './TextField';
import type { ProfileFormState } from './useProfileForm';

type FormProps = { form: ProfileFormState };
export { BioField } from './BioField';
export { ErrorBanner } from './ErrorBanner';

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
