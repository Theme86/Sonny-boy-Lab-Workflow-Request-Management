// lib/equipmentBody.ts — the body sent to the backend when the form is saved.
import type { EquipmentFields } from './equipmentTypes';

/** Body sent to POST / PATCH /api/equipment. An empty optional field becomes null so it is cleared. */
export function toRequestBody(fields: EquipmentFields, isEdit = false) {
  const total = Number(fields.quantityTotal || 0);
  const body: Record<string, unknown> = {
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    location: fields.location.trim() || null,
    quantityTotal: total,
  };
  // on create, leaving "available" empty makes the backend use the total;
  // on edit an empty box means 0 (like its placeholder), so what the form shows is what gets saved
  if (fields.quantityAvailable.trim() !== '') body.quantityAvailable = Number(fields.quantityAvailable);
  else if (isEdit) body.quantityAvailable = 0;
  return body;
}