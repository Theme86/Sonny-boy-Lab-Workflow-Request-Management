// components/profile/useProfileImages.ts — the picked (not yet saved) profile picture and banner, with previews.
import { useState } from 'react';
import { AVATAR_MAX_MB, BANNER_MAX_MB } from './profileImages';
import { useImagePick } from './useImagePick';

type Kind = 'avatar' | 'banner';

export function useProfileImages(setImageError: (kind: Kind, message?: string) => void, touch: () => void) {
  const [resetBanner, setResetBanner] = useState(false);
  const avatar = useImagePick(AVATAR_MAX_MB, (m) => setImageError('avatar', m), () => {});
  const banner = useImagePick(BANNER_MAX_MB, (m) => setImageError('banner', m), () => setResetBanner(false));

  return {
    avatarFile: avatar.file,
    bannerFile: banner.file,
    avatarPreview: avatar.preview,
    bannerPreview: banner.preview,
    resetBanner,
    hasChanges: !!avatar.file || !!banner.file || resetBanner,
    pickAvatar: (f: File | undefined) => (touch(), avatar.pick(f)),
    clearAvatar: avatar.clear,
    pickBanner: (f: File | undefined) => (touch(), banner.pick(f)),
    keepBanner: banner.clear,
    useDefaultBanner: () => (setResetBanner(true), touch()),
    bannerSaved: banner.clear,
    bannerResetDone: () => setResetBanner(false),
  };
}

export type ProfileImages = ReturnType<typeof useProfileImages>;
