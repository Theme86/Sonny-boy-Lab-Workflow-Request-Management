// components/equipment/EquipmentNameFields.tsx — the Name and Description fields of the pop-up.
import type { RefObject } from 'react';
import type { EquipmentForm } from '@/hooks/equipment/useEquipmentForm';
import { EQUIPMENT_LIMITS } from '@/lib/equipment';
import { ui } from '@/lib/ui';
import { EquipmentField } from './EquipmentField';

type Props = { form: EquipmentForm; nameRef: RefObject<HTMLInputElement | null> };

export function EquipmentNameFields({ form: { fields, errors, setField }, nameRef }: Props) {
  return (
    <>
      <EquipmentField label="Name" required error={errors.name}>
        <input
          ref={nameRef}
          value={fields.name}
          onChange={(e) => setField('name', e.target.value)}
          maxLength={EQUIPMENT_LIMITS.name}
          placeholder="e.g. Digital microscope"
          className={`${ui.input} ${errors.name ? ui.inputError : ''}`}
          aria-invalid={!!errors.name}
        />
      </EquipmentField>

      <EquipmentField
        label="Description"
        error={errors.description}
        hint={`${fields.description.trim().length} / ${EQUIPMENT_LIMITS.description}`}
      >
        <textarea
          value={fields.description}
          onChange={(e) => setField('description', e.target.value)}
          maxLength={EQUIPMENT_LIMITS.description}
          rows={3}
          placeholder="What it is used for"
          className={`${ui.input} resize-y`}
        />
      </EquipmentField>
    </>
  );
}