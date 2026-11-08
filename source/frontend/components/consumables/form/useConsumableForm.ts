// components/consumables/form/useConsumableForm.ts — state and submit logic of the add/edit form.
import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { hasErrors, toForm, toPayload, validateForm, type FormErrors, type FormState } from '@/lib/consumableForm';
import type { Consumable, SavePayload } from '@/lib/consumables';
import type { PhotoChange } from '../useConsumables';
import { usePhotoChoice } from './usePhotoChoice';

export type SaveHandler = (data: SavePayload, photo: PhotoChange) => Promise<void>;

export function useConsumableForm(initial: Consumable | undefined, onSave: SaveHandler) {
  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const photo = usePhotoChoice(initial?.imageUrl, (imageUrl) => setForm((f) => ({ ...f, imageUrl })));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateForm(form);
    setErrors(found);
    if (hasErrors(found) || photo.error) return;

    setSaving(true);
    setSaveError(null);
    try {
      // on success the parent closes the form, so `saving` only needs resetting on failure
      await onSave(toPayload(form, Boolean(photo.file)), { file: photo.file, remove: photo.remove });
    } catch (err) {
      // the backend's "Validation failed" answer names the fields, so show each message under its field
      const fieldErrors = err instanceof ApiError ? err.details : undefined;
      if (fieldErrors) setErrors(fieldErrors);
      setSaveError(fieldErrors ? 'Please fix the highlighted fields.' : err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return { form, errors, set, photo, saving, saveError, submit };
}
