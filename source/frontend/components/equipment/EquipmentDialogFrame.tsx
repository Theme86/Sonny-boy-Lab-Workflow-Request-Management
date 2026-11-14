// components/equipment/EquipmentDialogFrame.tsx — the dark backdrop and the white dialog box of the pop-up.
import { useRef, type ReactNode } from 'react';
import { trapFocus } from './trapFocus';

type Props = { titleId: string; onBackdropClick: () => void; children: ReactNode };

export function EquipmentDialogFrame({ titleId, onBackdropClick, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onBackdropClick(); // click on the dark backdrop
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => trapFocus(e, dialogRef.current)}
        className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-vl-surface shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)] dark:ring-1 dark:ring-vl-line"
      >
        {children}
      </div>
    </div>
  );
}