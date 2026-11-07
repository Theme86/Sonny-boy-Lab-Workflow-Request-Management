// components/profile/saveProfile.ts — the requests behind "Save": images first, then the text fields.
import { apiFetch } from '@/lib/api';
import type { ProfileFields, User } from '@/lib/users';
import { saveImages } from './saveImages';
import type { ProfileImages } from './useProfileImages';

export function saveFields(body: Record<string, unknown>) {
  return apiFetch<User>('/api/users/me', { method: 'PATCH', json: body });
}

/** Saves picked images, then the changed fields (always in setup, to mark the profile complete). */
export async function saveAll(
  user: User,
  { images, fields, changed, isSetup }: { images: ProfileImages; fields: ProfileFields; changed: (keyof ProfileFields)[]; isSetup: boolean },
  setUser: (u: User) => void,
): Promise<User> {
  const latest = await saveImages(user, images, setUser);
  if (changed.length === 0 && !isSetup) return latest;
  const body: Record<string, unknown> = {};
  for (const key of changed) body[key] = fields[key].trim();
  if (isSetup) body.markProfileComplete = true;
  const saved = await saveFields(body);
  setUser(saved);
  return saved;
}
