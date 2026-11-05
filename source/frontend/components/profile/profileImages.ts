// components/profile/profileImages.ts — limits and checks for the profile picture and banner.
export const AVATAR_MAX_MB = 2;
export const BANNER_MAX_MB = 5;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImage(file: File, maxMb: number): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WEBP image.';
  if (file.size > maxMb * 1024 * 1024) return `Choose an image of ${maxMb} MB or less.`;
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
