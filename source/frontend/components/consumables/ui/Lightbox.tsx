// components/consumables/ui/Lightbox.tsx — full-screen image viewer; click the background or press Escape to close.
import { Icon } from './icons';
import { useOverlay } from './useOverlay';

export type LightboxImage = { src: string; alt: string };

export function Lightbox({ src, alt, onClose }: LightboxImage & { onClose: () => void }) {
  useOverlay(onClose, true);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <Icon name="x" className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} className="max-h-[80vh] max-w-full rounded-lg bg-white object-contain shadow-2xl" />
      <p className="mt-4 text-sm text-white/80">{alt}</p>
    </div>
  );
}
