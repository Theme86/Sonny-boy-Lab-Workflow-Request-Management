// components/profile/PhotoPicker.tsx — the round profile picture with a camera button and its hints.
import { useRef } from 'react';
import { Avatar } from '@/components/Avatar';
import { CameraIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import { HiddenFileInput } from './HiddenFileInput';
import { PhotoHints } from './PhotoHints';
import type { ProfileFormState } from './useProfileForm';

export function PhotoPicker({ form }: { form: ProfileFormState }) {
  const input = useRef<HTMLInputElement>(null);
  const { user, images } = form;
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
      <PhotoHints form={form} />
      <HiddenFileInput inputRef={input} onPick={images.pickAvatar} />
    </div>
  );
}
