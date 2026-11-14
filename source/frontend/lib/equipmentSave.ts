// lib/equipmentSave.ts — saving the pop-up: first the text fields, then the photo.
import { apiFetch } from '@/lib/api';
import { toRequestBody } from './equipmentBody';
import type { Equipment, EquipmentFields } from './equipmentTypes';

type PhotoChange = { file: File | null; remove: boolean };

/** Step 1. Throws when the fields could not be saved. */
function saveFields(item: Equipment | null, fields: EquipmentFields) {
  const isEdit = item !== null;
  return apiFetch<Equipment>(isEdit ? `/api/equipment/${item.equipmentId}` : '/api/equipment', {
    method: isEdit ? 'PATCH' : 'POST',
    json: toRequestBody(fields, isEdit),
  });
}

/** Step 2. If only this step fails, the item is still saved, so the notice says so. */
async function savePhoto(saved: Equipment, item: Equipment | null, photo: PhotoChange) {
  const url = `/api/equipment/${saved.equipmentId}/image`;
  if (photo.file) {
    return apiFetch<Equipment>(url, { method: 'PUT', headers: { 'Content-Type': photo.file.type }, body: photo.file });
  }
  if (photo.remove && item?.imageUrl) return apiFetch<Equipment>(url, { method: 'DELETE' });
  return saved;
}

/** Returns the message the page shows. Only a failure of step 1 throws. */
export async function saveEquipment(item: Equipment | null, fields: EquipmentFields, photo: PhotoChange) {
  let saved = await saveFields(item, fields);
  let notice = item ? `${saved.name} was updated` : `${saved.name} was added`;
  try {
    saved = await savePhoto(saved, item, photo);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    notice = `${saved.name} was saved, but the photo could not be updated (${reason}). Open Edit to try again.`;
  }
  return notice;
}