// lib/equipmentPhoto.ts — checking and previewing the photo picked in the pop-up.
export const PHOTO_MAX_MB = 5;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validatePhoto(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WEBP image.';
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `Choose an image of ${PHOTO_MAX_MB} MB or less.`;
  return null;
}

/** Reads a picked image as a data URL so it can be previewed before saving. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}