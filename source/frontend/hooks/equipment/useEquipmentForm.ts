// hooks/equipment/useEquipmentForm.ts — the text fields of the pop-up, their errors and whether they changed.
import { useState } from 'react';
import {
  EMPTY_EQUIPMENT_FIELDS,
  fieldsFromEquipment,
  validateEquipment,
  type Equipment,
  type EquipmentErrors,
  type EquipmentFields,
} from '@/lib/equipment';

export function useEquipmentForm(item: Equipment | null) {
  const initial = item ? fieldsFromEquipment(item) : EMPTY_EQUIPMENT_FIELDS;
  const [fields, setFields] = useState<EquipmentFields>(initial);
  const [errors, setErrors] = useState<EquipmentErrors>({});

  const changed = (Object.keys(fields) as (keyof EquipmentFields)[]).some((k) => fields[k].trim() !== initial[k].trim());

  function setField(key: keyof EquipmentFields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  /** Shows the problems under the fields. True when there are none. */
  function validate() {
    const found = validateEquipment(fields);
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  return { fields, errors, changed, setField, validate };
}

export type EquipmentForm = ReturnType<typeof useEquipmentForm>;