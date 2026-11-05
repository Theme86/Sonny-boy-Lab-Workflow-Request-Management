// components/profile/saveImages.ts — uploads (or resets) the picked profile picture and banner.
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/users';
import type { ProfileImages } from './useProfileImages';

const upload = (path: string, file: File) =>
  apiFetch<User>(path, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

/** Uploads (or resets) the picked images, so a failed upload doesn't mark the profile as created. */
export async function saveImages(user: User, images: ProfileImages, setUser: (u: User) => void): Promise<User> {
  let latest = user;
  if (images.avatarFile) {
    latest = await upload('/api/users/me/avatar', images.avatarFile);
    setUser(latest);
    images.clearAvatar();
  }
  if (images.bannerFile) {
    latest = await upload('/api/users/me/banner', images.bannerFile);
    setUser(latest);
    images.bannerSaved();
  } else if (images.resetBanner) {
    latest = await apiFetch<User>('/api/users/me/banner', { method: 'DELETE' });
    setUser(latest);
    images.bannerResetDone();
  }
  return latest;
}
