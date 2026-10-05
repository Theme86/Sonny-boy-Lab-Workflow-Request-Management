// components/Avatar.tsx — profile picture with an initials fallback
'use client';

import { useState } from 'react';
import { imageUrl } from '@/lib/api';
import { initials, type User } from '@/lib/users';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-28 w-28 text-3xl',
} as const;

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
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 ${SIZES[size]} ${className}`}
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
