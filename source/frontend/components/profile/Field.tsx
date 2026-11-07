// components/profile/Field.tsx — a labelled form field and a titled card section.
import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';

export function Section({ title, description, children, className = '' }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`px-6 py-6 ${ui.card} ${className}`}>
      <h2 className="text-lg leading-7 font-medium">{title}</h2>
      {description && <p className={`mt-1 text-sm ${ui.muted}`}>{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
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
