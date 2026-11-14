// lib/equipmentTypes.ts — the shapes of equipment data and of the pop-up form.
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

export type EquipmentErrors = Partial<Record<keyof EquipmentFields, string>>;