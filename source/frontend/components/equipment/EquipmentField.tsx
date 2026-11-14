// components/equipment/EquipmentField.tsx — a label, an input and its error or hint.
import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';

type Props = { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode };

export function EquipmentField({ label, required, error, hint, children }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && (
          <span className={ui.errorText} aria-hidden>
            {' '}*
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span className={`mt-1 block text-xs ${ui.errorText}`}>{error}</span>
      ) : (
        hint && <span className={`mt-1 block text-xs ${ui.muted}`}>{hint}</span>
      )}
    </label>
  );
}