// components/equipment/EquipmentQuantityFields.tsx — the Total quantity and Available now fields of the pop-up.
import type { EquipmentForm } from '@/hooks/equipment/useEquipmentForm';
import { ui } from '@/lib/ui';
import { EquipmentField } from './EquipmentField';

const QUANTITY_MAX_DIGITS = 9; // up to 999,999,999, which always fits the database INT column

type Props = { form: EquipmentForm; isEdit: boolean };

export function EquipmentQuantityFields({ form: { fields, errors, setField }, isEdit }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <EquipmentField label="Total quantity" error={errors.quantityTotal}>
        <input
          value={fields.quantityTotal}
          onChange={(e) => setField('quantityTotal', e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          maxLength={QUANTITY_MAX_DIGITS}
          placeholder="0"
          className={`${ui.input} ${errors.quantityTotal ? ui.inputError : ''}`}
          aria-invalid={!!errors.quantityTotal}
        />
      </EquipmentField>
      <EquipmentField
        label="Available now"
        error={errors.quantityAvailable}
        hint={isEdit ? undefined : 'Leave empty to make all of them available.'}
      >
        <input
          value={fields.quantityAvailable}
          onChange={(e) => setField('quantityAvailable', e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          maxLength={QUANTITY_MAX_DIGITS}
          placeholder={isEdit ? '0' : 'Same as total'}
          className={`${ui.input} ${errors.quantityAvailable ? ui.inputError : ''}`}
          aria-invalid={!!errors.quantityAvailable}
        />
      </EquipmentField>
    </div>
  );
}