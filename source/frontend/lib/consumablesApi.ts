// lib/consumablesApi.ts — calls to /api/consumables.
import { apiFetch } from '@/lib/api';
import { fromApi, type ApiConsumable, type Consumable, type Hazard, type SavePayload } from '@/lib/consumables';

export async function fetchConsumables(): Promise<Consumable[]> {
  const rows = await apiFetch<ApiConsumable[]>('/api/consumables');
  return rows.map(fromApi);
}

/** Every hazard that can be attached to a consumable. */
export function fetchHazards() {
  return apiFetch<Hazard[]>('/api/consumables/hazards');
}

export function saveConsumable(data: SavePayload, editingId?: number) {
  return editingId
    ? apiFetch<ApiConsumable>(`/api/consumables/${editingId}`, { method: 'PUT', json: data })
    : apiFetch<ApiConsumable>('/api/consumables', { method: 'POST', json: data });
}

export function uploadConsumableImage(id: number, file: File) {
  return apiFetch<ApiConsumable>(`/api/consumables/${id}/image`, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
}

export function removeConsumableImage(id: number) {
  return apiFetch<ApiConsumable>(`/api/consumables/${id}/image`, { method: 'DELETE' });
}

export function deleteConsumable(id: number) {
  return apiFetch(`/api/consumables/${id}`, { method: 'DELETE' });
}
