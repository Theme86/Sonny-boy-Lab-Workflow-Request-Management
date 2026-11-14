// components/equipment/EquipmentModalBody.tsx — the scrolling middle of the pop-up: photo, fields and the error message.
import type { RefObject } from 'react';
import type { EquipmentForm } from '@/hooks/equipment/useEquipmentForm';
import type { EquipmentPhotoState } from '@/hooks/equipment/useEquipmentPhoto';
import type { Equipment } from '@/lib/equipment';
import { EquipmentLocationField } from './EquipmentLocationField';
import { EquipmentNameFields } from './EquipmentNameFields';
import { EquipmentPhotoPicker } from './EquipmentPhotoPicker';
import { EquipmentQuantityFields } from './EquipmentQuantityFields';

type Props = {
  item: Equipment | null;
  form: EquipmentForm;
  photo: EquipmentPhotoState;
  nameRef: RefObject<HTMLInputElement | null>;
  formError: string;
};

export function EquipmentModalBody({ item, form, photo, nameRef, formError }: Props) {
  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
      <EquipmentPhotoPicker photo={photo} item={item} name={form.fields.name.trim() || 'new equipment'} />
      <EquipmentNameFields form={form} nameRef={nameRef} />
      <EquipmentLocationField form={form} />
      <EquipmentQuantityFields form={form} isEdit={item !== null} />
      {formError && (
        <p role="alert" className="rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
          {formError}
        </p>
      )}
    </div>
  );
}