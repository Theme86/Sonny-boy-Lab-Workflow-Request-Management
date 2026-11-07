// components/profile/profileFields.ts — the text fields of the profile form.
import type { ProfileFields, User } from '@/lib/users';

export type FieldErrors = Partial<Record<keyof ProfileFields | 'avatar' | 'banner', string>>;

export const EMPTY_FIELDS: ProfileFields = { firstName: '', lastName: '', studentId: '', phone: '', department: '', bio: '' };

export function fieldsFrom(user: User): ProfileFields {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    studentId: user.studentId ?? '',
    phone: user.phone ?? '',
    department: user.department ?? '',
    bio: user.bio ?? '',
  };
}

/** Which fields differ from what is saved (compared without surrounding spaces). */
export function changedKeys(fields: ProfileFields, original: ProfileFields): (keyof ProfileFields)[] {
  return (Object.keys(fields) as (keyof ProfileFields)[]).filter((k) => fields[k].trim() !== original[k].trim());
}
