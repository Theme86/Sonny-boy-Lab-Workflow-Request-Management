// components/profile/PhotoHints.tsx — the text next to the profile picture: allowed types, "Keep current", errors.
import { ui } from '@/lib/ui';
import { AVATAR_MAX_MB } from './profileImages';
import type { ProfileFormState } from './useProfileForm';

export function PhotoHints({ form }: { form: ProfileFormState }) {
  const { images, errors } = form;
  return (
    <div className="min-w-0">
      <p className="text-sm">Profile picture</p>
      <p className={`text-xs ${ui.muted}`}>JPG, PNG or WEBP, up to {AVATAR_MAX_MB} MB</p>
      {images.avatarFile && (
        <button type="button" onClick={images.clearAvatar} className={`${ui.link} mt-1 text-xs`}>
          Keep current picture
        </button>
      )}
      {errors.avatar && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.avatar}</p>}
    </div>
  );
}
