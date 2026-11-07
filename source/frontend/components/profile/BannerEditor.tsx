// components/profile/BannerEditor.tsx — the banner preview with its buttons, hint and error.
import { useRef } from 'react';
import { imageUrl } from '@/lib/api';
import { ui } from '@/lib/ui';
import { BannerButtons } from './BannerButtons';
import { HiddenFileInput } from './HiddenFileInput';
import { BANNER_MAX_MB } from './profileImages';
import type { ProfileFormState } from './useProfileForm';

export function BannerEditor({ form }: { form: ProfileFormState }) {
  const input = useRef<HTMLInputElement>(null);
  const { user, images, errors } = form;
  if (!user) return null;

  const shown = images.bannerPreview ?? (images.resetBanner ? null : imageUrl(user.bannerUrl));

  return (
    <div>
      <div
        className="h-24 rounded-xl bg-gradient-to-br from-[#c2d7fb] to-vl-accent-soft bg-cover bg-center sm:h-28 dark:from-vl-accent-soft dark:to-[#2a2f3a]"
        style={shown ? { backgroundImage: `url("${shown}")` } : undefined}
        role="img"
        aria-label="Banner preview"
      />
      <BannerButtons images={images} onChange={() => input.current?.click()} />
      <p className={`mt-1 text-xs ${ui.muted}`}>
        {images.resetBanner ? 'The default banner will be used when you save.' : `Wide image, up to ${BANNER_MAX_MB} MB`}
      </p>
      {errors.banner && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.banner}</p>}
      <HiddenFileInput inputRef={input} onPick={images.pickBanner} />
    </div>
  );
}
