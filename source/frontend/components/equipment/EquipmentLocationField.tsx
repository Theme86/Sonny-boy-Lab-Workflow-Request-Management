// components/equipment/EquipmentLocationField.tsx — the Location field of the pop-up.
import type { EquipmentForm } from '@/hooks/equipment/useEquipmentForm';
import { EQUIPMENT_LIMITS } from '@/lib/equipment';
import { ui } from '@/lib/ui';
import { EquipmentField } from './EquipmentField';

export function EquipmentLocationField({ form: { fields, errors, setField } }: { form: EquipmentForm }) {
  return (
    <EquipmentField label="Location" error={errors.location}>
      <input
        value={fields.location}
        onChange={(e) => setField('location', e.target.value)}
        maxLength={EQUIPMENT_LIMITS.location}
        placeholder="e.g. Room 101, shelf B"
        className={ui.input}
      />
    </EquipmentField>
  );
}