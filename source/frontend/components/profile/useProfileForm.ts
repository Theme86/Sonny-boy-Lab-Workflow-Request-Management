// components/profile/useProfileForm.ts — all the state and the submit handler of the profile form.
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { validateProfile, type ProfileFields } from '@/lib/users';
import { changedKeys, EMPTY_FIELDS, fieldsFrom, type FieldErrors } from './profileFields';
import { saveFields, saveImages } from './saveProfile';
import { useProfileImages } from './useProfileImages';

export function useProfileForm(mode: 'setup' | 'edit') {
  const { user, setUser } = useCurrentUser();
  const router = useRouter();
  const isSetup = mode === 'setup';

  const [fields, setFields] = useState<ProfileFields>(() => (user ? fieldsFrom(user) : EMPTY_FIELDS));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const images = useProfileImages(
    (kind, message) => setErrors((e) => ({ ...e, [kind]: message })),
    () => setSaved(false),
  );

  const changed = user ? changedKeys(fields, fieldsFrom(user)) : [];
  const hasChanges = changed.length > 0 || images.hasChanges;

  function setField(key: keyof ProfileFields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setSaved(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setSaved(false);

    const fieldErrors = validateProfile(fields);
    setErrors((prev) => ({ avatar: prev.avatar, banner: prev.banner, ...fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) return;

    setSaving(true);
    try {
      let latest = await saveImages(user, images, setUser);
      if (changed.length > 0 || isSetup) {
        const body: Record<string, unknown> = {};
        for (const key of changed) body[key] = fields[key].trim();
        if (isSetup) body.markProfileComplete = true;
        latest = await saveFields(body);
        setUser(latest);
      }
      if (isSetup) {
        router.replace('/profile');
        return;
      }
      setFields(fieldsFrom(latest));
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Your profile could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return { user, fields, errors, formError, saving, saved, hasChanges, images, setField, onSubmit };
}

export type ProfileFormState = ReturnType<typeof useProfileForm>;
