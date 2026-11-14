// hooks/equipment/useEquipmentModal.ts — everything the add / edit pop-up needs, put together.
import type { RefObject } from 'react';
import type { Equipment } from '@/lib/equipment';
import { useDialogBehavior } from './useDialogBehavior';
import { useEquipmentForm } from './useEquipmentForm';
import { useEquipmentPhoto } from './useEquipmentPhoto';
import { useEquipmentSubmit } from './useEquipmentSubmit';

type Args = {
  item: Equipment | null;
  nameRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSaved: (notice: string) => void;
};

export function useEquipmentModal({ item, nameRef, onClose, onSaved }: Args) {
  const form = useEquipmentForm(item);
  const photo = useEquipmentPhoto();
  const { formError, saving, onSubmit } = useEquipmentSubmit({ item, form, photo, onSaved });

  const dirty = form.changed || !!photo.file || photo.remove;

  function requestClose() {
    if (saving) return;
    if (dirty && !window.confirm('Discard your changes?')) return;
    onClose();
  }
  useDialogBehavior(nameRef, requestClose);

  return { form, photo, formError, saving, dirty, onSubmit, requestClose };
}