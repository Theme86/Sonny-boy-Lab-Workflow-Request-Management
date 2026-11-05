// components/profile/useProfileForm.ts — the state of the profile form; saving is in useProfileSubmit.
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { ProfileFields } from '@/lib/users';
import { changedKeys, EMPTY_FIELDS, fieldsFrom, type FieldErrors } from './profileFields';
import { useProfileImages } from './useProfileImages';
import { useProfileSubmit } from './useProfileSubmit';

export function useProfileForm(mode: 'setup' | 'edit') {
  const { user } = useCurrentUser();
  const [fields, setFields] = useState<ProfileFields>(() => (user ? fieldsFrom(user) : EMPTY_FIELDS));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  const images = useProfileImages(
    (kind, message) => setErrors((e) => ({ ...e, [kind]: message })),
    () => setSaved(false),
  );

  const changed = user ? changedKeys(fields, fieldsFrom(user)) : [];
  const hasChanges = changed.length > 0 || images.hasChanges;
  const { formError, saving, onSubmit } = useProfileSubmit({ isSetup: mode === 'setup', fields, changed, images, setFields, setErrors, setSaved });

  function setField(key: keyof ProfileFields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setSaved(false);
  }

  return { user, fields, errors, formError, saving, saved, hasChanges, images, setField, onSubmit };
}

export type ProfileFormState = ReturnType<typeof useProfileForm>;
