// components/profile/PhotoPicker.tsx — the round profile picture with a camera button and its hints.
import { useRef } from 'react';
import { Avatar } from '@/components/Avatar';
import { CameraIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import { ACCEPTED_TYPES, AVATAR_MAX_MB } from './profileImages';
import type { ProfileFormState } from './useProfileForm';

export function PhotoPicker({ form }: { form: ProfileFormState }) {
  const input = useRef<HTMLInputElement>(null);
  const { user, images, errors } = form;
  if (!user) return null;

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`group relative rounded-full ${ui.focus}`}
        aria-label={user.avatarUrl || images.avatarFile ? 'Change profile picture' : 'Add profile picture'}
      >
        <Avatar user={user} size="lg" previewSrc={images.avatarPreview} />
        <span className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border border-vl-line bg-vl-surface text-vl-ink-soft group-hover:bg-vl-hover">
          <CameraIcon width={16} height={16} />
        </span>
      </button>
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
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          images.pickAvatar(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
