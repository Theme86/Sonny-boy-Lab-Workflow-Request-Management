// hooks/equipment/useDialogBehavior.ts — what every equipment pop-up needs while it is open:
// lock page scrolling, focus one element, close on Esc, and give focus back afterwards.
import { useEffect, useRef, type RefObject } from 'react';

export function useDialogBehavior(focusRef: RefObject<HTMLElement | null>, onClose: () => void) {
  // the latest onClose for the key handler, so the listener is only registered once
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [focusRef]);
}