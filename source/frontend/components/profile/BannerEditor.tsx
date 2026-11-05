// components/profile/BannerEditor.tsx — the banner preview with "Change banner" / "Keep current" / "Use default" buttons.
import { useRef } from 'react';
import { imageUrl } from '@/lib/api';
import { ui } from '@/lib/ui';
import { ACCEPTED_TYPES, BANNER_MAX_MB } from './profileImages';
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
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <button type="button" className={ui.btnText} onClick={() => input.current?.click()}>
          Change banner
        </button>
        {images.bannerFile ? (
          <button type="button" className={ui.btnText} onClick={images.keepBanner}>
            Keep current banner
          </button>
        ) : (
          !images.resetBanner && (
            <button type="button" className={ui.btnText} onClick={images.useDefaultBanner}>
              Use default banner
            </button>
          )
        )}
      </div>
      <p className={`mt-1 text-xs ${ui.muted}`}>
        {images.resetBanner ? 'The default banner will be used when you save.' : `Wide image, up to ${BANNER_MAX_MB} MB`}
      </p>
      {errors.banner && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.banner}</p>}
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          images.pickBanner(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
