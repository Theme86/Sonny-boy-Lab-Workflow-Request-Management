// lib/equipmentFields.ts — the starting values of the pop-up form.
import type { Equipment, EquipmentFields } from './equipmentTypes';

export const EMPTY_EQUIPMENT_FIELDS: EquipmentFields = {
  name: '',
  description: '',
  location: '',
  quantityTotal: '',
  quantityAvailable: '',
};

export function fieldsFromEquipment(item: Equipment): EquipmentFields {
  return {
    name: item.name,
    description: item.description ?? '',
    location: item.location ?? '',
    quantityTotal: String(item.quantityTotal),
    quantityAvailable: String(item.quantityAvailable),
  };
}