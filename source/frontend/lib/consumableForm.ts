// lib/consumableForm.ts — the add/edit form: field values, validation, and the payload sent to the API.
import type { Consumable, SavePayload } from '@/lib/consumables';

export const PHOTO_MAX_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type FormState = {
  name: string;
  description: string;
  unit: string;
  currentStock: string;
  reorderThreshold: string;
  phValue: string;
  expiryDate: string;
  imageUrl: string;
  hazardIds: number[];
};
export type FormErrors = Partial<Record<keyof FormState, string>>;

export function toForm(c?: Consumable): FormState {
  return {
    name: c?.name ?? '',
    description: c?.description ?? '',
    unit: c?.unit ?? '',
    currentStock: c ? String(c.currentStock) : '',
    reorderThreshold: c ? String(c.reorderThreshold) : '',
    phValue: c?.phValue != null ? String(c.phValue) : '',
    expiryDate: c?.expiryDate ?? '',
    imageUrl: c?.imageUrl ?? '',
    hazardIds: c?.hazards.map((h) => h.hazardId) ?? [],
  };
}

export function validateForm(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = 'Name is required.';
  else if (f.name.length > 150) e.name = 'Max 150 characters.';
  if (f.description.length > 250) e.description = 'Max 250 characters.';
  if (!f.unit) e.unit = 'Select a unit.';
  if (f.currentStock === '') e.currentStock = 'Required.';
  else if (Number(f.currentStock) < 0) e.currentStock = 'Must be 0 or more.';
  if (f.reorderThreshold === '') e.reorderThreshold = 'Required.';
  else if (Number(f.reorderThreshold) < 0) e.reorderThreshold = 'Must be 0 or more.';
  if (f.phValue !== '') {
    const ph = Number(f.phValue);
    if (Number.isNaN(ph) || ph < 0 || ph > 14) e.phValue = 'pH must be between 0 and 14.';
  }
  if (f.imageUrl.length > 500) e.imageUrl = 'URL max 500 characters.';
  return e;
}

export const hasErrors = (e: FormErrors) => Object.values(e).some(Boolean);

/** An uploaded file replaces any pasted URL, so the URL is cleared when a file is chosen. */
export function toPayload(f: FormState, hasPhotoFile: boolean): SavePayload {
  return {
    name: f.name.trim(),
    description: f.description.trim() || null,
    unit: f.unit,
    currentStock: Number(f.currentStock),
    reorderThreshold: Number(f.reorderThreshold),
    phValue: f.phValue === '' ? null : Number(f.phValue),
    expiryDate: f.expiryDate || null,
    imageUrl: hasPhotoFile ? null : f.imageUrl.trim() || null,
    hazardIds: f.hazardIds,
  };
}

export function validatePhoto(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WEBP image.';
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `Choose an image of ${PHOTO_MAX_MB} MB or less.`;
  return null;
}
