// components/EquipmentLightbox.tsx — shows one equipment photo large on a dark backdrop.
// Click the backdrop, click the X, or press Esc to close.
'use client';

import { useRef } from 'react';
import { CloseIcon } from '@/components/equipmentIcons';
import { useDialogBehavior } from '@/hooks/equipment/useDialogBehavior';

type Props = {
  /** full photo address (already resolved with imageUrl()) */
  src: string;
  name: string;
  onClose: () => void;
};

export function EquipmentLightbox({ src, name, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useDialogBehavior(closeButton, onClose);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo of ${name}`}
      onClick={onClose}
    >
      <button
        ref={closeButton}
        type="button"
        aria-label="Close photo"
        onClick={onClose}
        className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <CloseIcon />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- images come from the backend, not the Next.js image optimizer */}
      <img
        src={src}
        alt={`Photo of ${name}`}
        onClick={(e) => e.stopPropagation()} // a click on the photo itself should not close it
        className="max-h-[80vh] max-w-full rounded-lg bg-white object-contain shadow-2xl"
      />
      <p className="mt-4 text-sm text-white/80">{name}</p>
    </div>
  );
}