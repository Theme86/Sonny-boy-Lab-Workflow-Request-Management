// components/Avatar.tsx — profile picture with an initials fallback
'use client';

import { useState } from 'react';
import { imageUrl } from '@/lib/api';
import { initials, type User } from '@/lib/users';

const SIZES = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-4xl sm:h-28 sm:w-28',
} as const;

// Muted colors for the initials circle; each person always gets the same one.
const COLORS = ['#3f5aa8', '#0f7068', '#7a5230', '#6a4a9c', '#2f6b3a', '#a4402f', '#455a64'];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

type Props = {
  user: Pick<User, 'firstName' | 'lastName' | 'email' | 'avatarUrl'>;
  size?: keyof typeof SIZES;
  /** Shows a local preview (e.g. a file the user just picked) instead of the saved avatar. */
  previewSrc?: string | null;
  className?: string;
};

export function Avatar({ user, size = 'md', previewSrc, className = '' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = previewSrc ?? imageUrl(user.avatarUrl);
  const showImage = src && src !== failedSrc;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-normal text-white select-none ${SIZES[size]} ${className}`}
      style={showImage ? undefined : { backgroundColor: colorFor(user.email) }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- images come from the backend, not the Next.js image optimizer
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span aria-hidden>{initials(user)}</span>
      )}
    </span>
  );
}
