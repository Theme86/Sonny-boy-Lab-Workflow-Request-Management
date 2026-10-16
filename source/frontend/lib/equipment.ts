// lib/equipment.ts types and validation for the equipment pages.
export type Equipment = {
  equipmentId: number;
  name: string;
  description: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  location: string | null;
  imageUrl: string | null;
};
 
export type EquipmentListResponse = {
  items: Equipment[];
  page: number;
  limit: number;
  total: number;
};
 
export const EQUIPMENT_LIMITS = { name: 150, description: 250, location: 100 } as const;
 
/** What the pop-up form edits. Quantities are text because that is what an <input> gives. */
export type EquipmentFields = {
  name: string;
  description: string;
  location: string;
  quantityTotal: string;
  quantityAvailable: string;
};
 
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
 
export type EquipmentErrors = Partial<Record<keyof EquipmentFields, string>>;
 
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
 
/** Body sent to POST / PATCH /api/equipment. An empty optional field becomes null so it is cleared. */
export function toRequestBody(fields: EquipmentFields) {
  const total = Number(fields.quantityTotal || 0);
  const body: Record<string, unknown> = {
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    location: fields.location.trim() || null,
    quantityTotal: total,
  };
  // on create, leaving "available" empty makes the backend use the total
  if (fields.quantityAvailable.trim() !== '') body.quantityAvailable = Number(fields.quantityAvailable);
  return body;
}
 
export type Stock = 'in' | 'low' | 'out';
 
/** out = none free, low = 25% or less is free, in = plenty free */
export function stockLevel(item: Pick<Equipment, 'quantityTotal' | 'quantityAvailable'>): Stock {
  if (item.quantityAvailable <= 0) return 'out';
  if (item.quantityTotal > 0 && item.quantityAvailable / item.quantityTotal <= 0.25) return 'low';
  return 'in';
}
 
export const STOCK_LABELS: Record<Stock, string> = {
  in: 'Available',
  low: 'Running low',
  out: 'None available',
};