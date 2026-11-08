// components/consumables/form/FormFields.tsx — label + input + error wrapper, form sections, and a number input with its unit.
import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { inputClass, labelCls } from '../ui/styles';

type FieldProps = { label: string; required?: boolean; hint?: string; help?: string; error?: string; children: ReactNode };

/** `hint` sits right of the label (e.g. a character count); `help` sits under the input and is replaced by `error`. */
export function Field({ label, required, hint, help, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className={labelCls}>
          {label}
          {required && <span className={ui.errorText}> *</span>}
        </span>
        {hint && <span className={`text-xs tabular-nums ${ui.muted}`}>{hint}</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error ? (
        <span className={`mt-1 block text-xs ${ui.errorText}`}>{error}</span>
      ) : help ? (
        <span className={`mt-1 block text-xs ${ui.muted}`}>{help}</span>
      ) : null}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className={`mb-3 border-b pb-2 ${ui.border}`}>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

type QuantityProps = { value: string; unit: string; invalid: boolean; onChange: (v: string) => void };

export function QuantityInput({ value, unit, invalid, onChange }: QuantityProps) {
  return (
    <span className="relative block">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`${inputClass(invalid)} !pr-14`}
      />
      <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm ${ui.muted}`}>{unit}</span>
    </span>
  );
}
