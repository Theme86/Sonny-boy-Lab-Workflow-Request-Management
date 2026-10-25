// components/EquipmentPhoto.tsx an equipment photo with a picture-frame fallback
'use client';
 
import { useState } from 'react';
import { ImageIcon } from '@/components/equipmentIcons';
import { imageUrl } from '@/lib/api';
 
const SIZES = {
  sm: 'h-12 w-12 rounded-lg',
  md: 'h-16 w-16 rounded-xl',
  /** the larger preview used by the pop-up form */
  lg: 'h-28 w-44 rounded-xl',
} as const;
 
type Props = {
  /** the saved path from the backend */
  src: string | null | undefined;
  /** a local preview is shown instead of the saved photo */
  previewSrc?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
};
 
export function EquipmentPhoto({ src, previewSrc, name, size = 'sm', className = '' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shown = previewSrc ?? imageUrl(src);
  const showImage = shown && shown !== failedSrc;
 
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-[#e9eef6] text-[#5f6368] dark:bg-[#282a2c] dark:text-[#9aa0a6] ${SIZES[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={shown}
          alt={`Photo of ${name}`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(shown)}
        />
      ) : (
        <ImageIcon width={size === 'lg' ? 40 : 24} height={size === 'lg' ? 40 : 24} />
      )}
    </span>
  );
}