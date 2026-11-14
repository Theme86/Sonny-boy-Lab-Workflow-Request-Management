// components/equipment/trapFocus.ts — Tab / Shift+Tab stay inside the pop-up.
import type { KeyboardEvent } from 'react';

export function trapFocus(e: KeyboardEvent<HTMLDivElement>, dialog: HTMLElement | null) {
  if (e.key !== 'Tab' || !dialog) return;
  const focusable = dialog.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]):not([type="file"]), textarea:not([disabled]), [href], select:not([disabled])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}