// components/profile/useImagePick.ts — one picked (not yet saved) image: the file, its preview, and validation.
import { useState } from 'react';
import { readAsDataUrl, validateImage } from './profileImages';

// clearOnError: a rejected file also drops the one picked before (the avatar does this; the banner keeps it).
export function useImagePick(maxMb: number, setError: (message?: string) => void, onPicked: () => void, clearOnError = false) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function clear() {
    setFile(null);
    setPreview(null);
  }

  function pick(picked: File | undefined) {
    if (!picked) return;
    const error = validateImage(picked, maxMb);
    setError(error ?? undefined);
    if (error) {
      if (clearOnError) clear();
      return;
    }
    setFile(picked);
    setPreview(null);
    onPicked();
    readAsDataUrl(picked).then(setPreview).catch(() => {});
  }

  return { file, preview, pick, clear };
}
