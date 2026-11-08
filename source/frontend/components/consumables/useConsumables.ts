// components/consumables/useConsumables.ts — loads the list and saves / deletes consumables (including the photo).
import { useEffect, useState } from 'react';
import type { Consumable, SavePayload } from '@/lib/consumables';
import {
  deleteConsumable,
  fetchConsumables,
  removeConsumableImage,
  saveConsumable,
  uploadConsumableImage,
} from '@/lib/consumablesApi';

export type PhotoChange = { file: File | null; remove: boolean };

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function useConsumables() {
  const [items, setItems] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    fetchConsumables()
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        setError(null);
      })
      .catch((err) => !cancelled && setError(errorText(err, 'Could not load consumables')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /**
   * Saves the fields, then the photo. Throws if the fields fail (the form shows the message);
   * a failed photo only adds a note to the returned message, because the item itself was saved.
   */
  async function save(data: SavePayload, editing: Consumable | undefined, photo: PhotoChange): Promise<string> {
    const saved = await saveConsumable(data, editing?.consumableId);
    let notice = editing ? `Saved changes to ${data.name}` : `${data.name} added`;
    try {
      if (photo.file) await uploadConsumableImage(saved.consumableId, photo.file);
      else if (photo.remove && !data.imageUrl && editing?.imageUrl) await removeConsumableImage(saved.consumableId);
    } catch (err) {
      notice = `${notice}, but the image could not be updated (${errorText(err, 'unknown error')}). Open Edit to try again.`;
    }
    reload();
    return notice;
  }

  async function remove(item: Consumable): Promise<string> {
    await deleteConsumable(item.consumableId);
    reload();
    return `${item.name} deleted`;
  }

  return { items, loading, error, reload, save, remove };
}
