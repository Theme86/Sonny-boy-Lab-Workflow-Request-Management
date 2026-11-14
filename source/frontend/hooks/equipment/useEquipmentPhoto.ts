// hooks/equipment/useEquipmentPhoto.ts — the photo chosen (or removed) in the pop-up.
import { useState } from 'react';
import { readAsDataUrl, validatePhoto } from '@/lib/equipmentPhoto';

export function useEquipmentPhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function pick(picked: File | undefined) {
    if (!picked) return;
    const problem = validatePhoto(picked);
    setError(problem ?? undefined);
    if (problem) return;
    setFile(picked);
    setRemove(false);
    setPreview(null);
    readAsDataUrl(picked).then(setPreview).catch(() => {});
  }

  function keepCurrent() {
    setFile(null);
    setPreview(null);
    setRemove(false);
  }

  return { file, preview, remove, error, pick, keepCurrent, markRemoved: () => setRemove(true) };
}

export type EquipmentPhotoState = ReturnType<typeof useEquipmentPhoto>;