// components/profile/useProfileSubmit.ts — validates the form, saves images and fields, then leaves setup or shows "saved".
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { validateProfile, type ProfileFields } from '@/lib/users';
import { fieldsFrom, type FieldErrors } from './profileFields';
import { saveAll } from './saveProfile';
import type { ProfileImages } from './useProfileImages';
import { useSaving } from './useSaving';

type Input = {
  isSetup: boolean;
  fields: ProfileFields;
  changed: (keyof ProfileFields)[];
  images: ProfileImages;
  setFields: (f: ProfileFields) => void;
  setErrors: (update: (prev: FieldErrors) => FieldErrors) => void;
  setSaved: (saved: boolean) => void;
};

export function useProfileSubmit({ isSetup, fields, changed, images, setFields, setErrors, setSaved }: Input) {
  const { user, setUser } = useCurrentUser();
  const router = useRouter();
  const { formError, saving, run } = useSaving();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaved(false);

    const fieldErrors = validateProfile(fields);
    setErrors((prev) => ({ avatar: prev.avatar, banner: prev.banner, ...fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) return;

    await run(async () => {
      const latest = await saveAll(user, { images, fields, changed, isSetup }, setUser);
      if (isSetup) return router.replace('/profile');
      setFields(fieldsFrom(latest));
      setSaved(true);
    });
  }

  return { formError, saving, onSubmit };
}
