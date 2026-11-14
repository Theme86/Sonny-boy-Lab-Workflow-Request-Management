// lib/equipmentValidation.ts — checks the pop-up form before anything is sent.
import type { EquipmentErrors, EquipmentFields } from './equipmentTypes';

function isWholeNumber(text: string) {
  return /^\d+$/.test(text.trim());
}

/**get the message before anything is sent. */
export function validateEquipment(fields: EquipmentFields): EquipmentErrors {
  const errors: EquipmentErrors = {};

  if (!fields.name.trim()) errors.name = 'Enter a name for this equipment.';

  if (fields.quantityTotal.trim() !== '' && !isWholeNumber(fields.quantityTotal)) {
    errors.quantityTotal = 'Use a whole number of 0 or more.';
  }
  if (fields.quantityAvailable.trim() !== '' && !isWholeNumber(fields.quantityAvailable)) {
    errors.quantityAvailable = 'Use a whole number of 0 or more.';
  }

  if (!errors.quantityTotal && !errors.quantityAvailable) {
    const total = Number(fields.quantityTotal || 0);
    if (fields.quantityAvailable.trim() !== '' && Number(fields.quantityAvailable) > total) {
      errors.quantityAvailable = 'Available cannot be more than the total.';
    }
  }

  return errors;
}