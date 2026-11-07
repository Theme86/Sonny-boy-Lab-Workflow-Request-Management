// components/profile/BannerButtons.tsx — "Change banner" and "Keep current" / "Use default" under the banner.
import { ui } from '@/lib/ui';
import type { ProfileImages } from './useProfileImages';

export function BannerButtons({ images, onChange }: { images: ProfileImages; onChange: () => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
      <button type="button" className={ui.btnText} onClick={onChange}>
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
  );
}
