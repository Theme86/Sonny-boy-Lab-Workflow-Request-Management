// components/profile/useProfileImages.ts — the picked (not yet saved) profile picture and banner, with previews.
import { useState } from 'react';
import { AVATAR_MAX_MB, BANNER_MAX_MB, readAsDataUrl, validateImage } from './profileImages';

type Kind = 'avatar' | 'banner';

export function useProfileImages(setImageError: (kind: Kind, message?: string) => void, touch: () => void) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [resetBanner, setResetBanner] = useState(false);

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  function keepBanner() {
    setBannerFile(null);
    setBannerPreview(null);
  }

  function pickAvatar(file: File | undefined) {
    touch();
    if (!file) return;
    const error = validateImage(file, AVATAR_MAX_MB);
    setImageError('avatar', error ?? undefined);
    setAvatarFile(error ? null : file);
    setAvatarPreview(null);
    if (!error) readAsDataUrl(file).then(setAvatarPreview).catch(() => {});
  }

  function pickBanner(file: File | undefined) {
    touch();
    if (!file) return;
    const error = validateImage(file, BANNER_MAX_MB);
    setImageError('banner', error ?? undefined);
    if (error) return;
    setBannerFile(file);
    setResetBanner(false);
    setBannerPreview(null);
    readAsDataUrl(file).then(setBannerPreview).catch(() => {});
  }

  function useDefaultBanner() {
    setResetBanner(true);
    touch();
  }

  return {
    avatarFile,
    bannerFile,
    avatarPreview,
    bannerPreview,
    resetBanner,
    hasChanges: !!avatarFile || !!bannerFile || resetBanner,
    pickAvatar,
    clearAvatar,
    pickBanner,
    keepBanner,
    useDefaultBanner,
    bannerSaved: keepBanner,
    bannerResetDone: () => setResetBanner(false),
  };
}

export type ProfileImages = ReturnType<typeof useProfileImages>;
