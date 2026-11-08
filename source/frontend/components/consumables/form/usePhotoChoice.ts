// components/consumables/form/usePhotoChoice.ts — the photo picked in the form: a new file, keeping or removing the saved one.
import { useState } from 'react';
import { validatePhoto } from '@/lib/consumableForm';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * `savedUrl` is the item's current image. `setImageUrl` writes the form's URL field, which is cleared
 * whenever a file is chosen or the saved image is removed, so only one image source is ever sent.
 */
export function usePhotoChoice(savedUrl: string | null | undefined, setImageUrl: (url: string) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(picked: File | undefined) {
    if (!picked) return;
    const problem = validatePhoto(picked);
    setError(problem);
    if (problem) return;
    setFile(picked);
    setRemove(false);
    setImageUrl('');
    readAsDataUrl(picked)
      .then(setPreview)
      .catch(() => setError('The image preview could not be loaded.'));
  }

  function keepSaved() {
    setFile(null);
    setPreview(null);
    setRemove(false);
    setError(null);
    setImageUrl(savedUrl ?? '');
  }

  function removeSaved() {
    setRemove(true);
    setImageUrl('');
  }

  const hasSaved = Boolean(savedUrl && !remove);
  return {
    file,
    preview,
    remove,
    error,
    hasSaved,
    hasAny: Boolean(file || hasSaved),
    pick,
    keepSaved,
    removeSaved,
    /** Typing a URL means the user wants an image again. */
    urlEdited: () => setRemove(false),
  };
}

export type PhotoChoice = ReturnType<typeof usePhotoChoice>;
