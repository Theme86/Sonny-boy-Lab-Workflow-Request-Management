// components/consumables/ui/Thumb.tsx — square image thumbnail with a flask placeholder when there is no (or a broken) image.
import { useState } from 'react';
import { imageUrl as resolveImageUrl } from '@/lib/api';
import { ui } from '@/lib/ui';
import { Icon } from './icons';

type ThumbProps = {
  src: string | null;
  alt: string;
  size?: 'sm' | 'lg';
  onClick?: () => void;
  /** A local data URL shown instead of `src`, e.g. a file picked but not uploaded yet. */
  previewSrc?: string | null;
};

export function Thumb({ src, alt, size = 'sm', onClick, previewSrc }: ThumbProps) {
  const resolved = previewSrc ?? resolveImageUrl(src);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const box = size === 'lg' ? 'h-28 w-28 rounded-xl' : 'h-11 w-11 rounded-lg';

  if (!resolved || brokenSrc === resolved) {
    return (
      <div className={`${box} grid shrink-0 place-items-center bg-vl-hover ${ui.muted}`}>
        <Icon name="flask" className={size === 'lg' ? 'h-8 w-8' : 'h-5 w-5'} />
      </div>
    );
  }
  return (
    <button
      type="button"
      title="View image"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`${box} shrink-0 overflow-hidden bg-[#f1f3f4] ring-1 ring-vl-line transition hover:ring-vl-accent ${ui.focus}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolved} alt={alt} onError={() => setBrokenSrc(resolved)} className="h-full w-full object-cover" />
    </button>
  );
}
