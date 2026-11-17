// app/requests/new/Field.tsx — a label, an input slot, and the error or hint under it (used by the submit form).
import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className={`mt-1.5 text-sm ${ui.errorText}`}>
          {error}
        </p>
      ) : (
        hint && <p className={`mt-1.5 text-xs ${ui.muted}`}>{hint}</p>
      )}
    </div>
  );
}