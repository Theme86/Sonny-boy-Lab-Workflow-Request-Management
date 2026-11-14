// hooks/equipment/useEquipmentSubmit.ts — what happens when the pop-up form is submitted.
import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import type { Equipment } from '@/lib/equipment';
import { saveEquipment } from '@/lib/equipmentSave';
import type { EquipmentForm } from './useEquipmentForm';
import type { EquipmentPhotoState } from './useEquipmentPhoto';

type Args = { item: Equipment | null; form: EquipmentForm; photo: EquipmentPhotoState; onSaved: (notice: string) => void };

export function useEquipmentSubmit({ item, form, photo, onSaved }: Args) {
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.validate()) return;

    setSaving(true);
    let notice: string;
    try {
      notice = await saveEquipment(item, form.fields, photo);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'The equipment could not be saved. Try again.');
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved(notice);
  }

  return { formError, saving, onSubmit };
}