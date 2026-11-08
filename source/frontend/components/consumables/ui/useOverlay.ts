// components/consumables/ui/useOverlay.ts — Escape closes the overlay and the page behind it stops scrolling.
import { useEffect, useRef } from 'react';

/** With `capture`, this overlay handles Escape first, so stacked overlays close top-most first. */
export function useOverlay(onClose: () => void, capture = false) {
  const ref = useRef(onClose);
  useEffect(() => {
    ref.current = onClose;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (capture) e.stopPropagation();
      ref.current();
    };
    window.addEventListener('keydown', onKey, capture);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, capture);
      document.body.style.overflow = prev;
    };
  }, [capture]);
}
