// app/requests/new/page.tsx  ->  /requests/new
// Submit-request form (US-01).
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  API_URL,
  FORM_TYPES,
  LIMITS,
  PRIORITIES,
  RESOURCE_TYPES,
  emptyForm,
  toPayload,
  validateForm,
  type FormErrors,
  type FormValues,
} from '@/lib/requests';

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400';

function Field({
  label, error, hint, children,
}: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function NewRequestPage() {
  const router = useRouter();
  const { user, loading, error: authError } = useRequireAuth();
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const clientErrors = validateForm(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(values)),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) return router.push('/login');
      if (res.status === 400 && data?.details) {
        setErrors(data.details as FormErrors); // server-side validation messages
        return;
      }
      if (!res.ok) {
        setFormError(data?.error ?? 'Could not submit the request');
        return;
      }
      router.push(`/requests/${data.request.requestId}`);
    } catch {
      setFormError('Could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="p-8">Loading...</p>;
  if (authError) return <p className="p-8 text-red-600">{authError}</p>;
  if (!user) return null; // redirecting to /login

  return (
    <main className="mx-auto w-full max-w-2xl p-6 sm:p-8">
      <Link href="/requests" className="text-sm text-zinc-500 hover:underline">← Back to requests</Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Submit a request</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Request type" error={errors.type}>
          <select
            className={inputClass}
            value={values.type}
            onChange={(e) => set('type', e.target.value)}
          >
            {FORM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Title *" error={errors.title}>
          <input
            className={inputClass}
            value={values.title}
            maxLength={LIMITS.titleMax}
            placeholder="e.g. Microscope lens is cracked"
            onChange={(e) => set('title', e.target.value)}
          />
        </Field>

        <Field
          label="Description *"
          error={errors.description}
          hint={`${values.description.length}/${LIMITS.descMax}`}
        >
          <textarea
            className={inputClass}
            rows={4}
            value={values.description}
            maxLength={LIMITS.descMax}
            placeholder="Describe what you need or what went wrong"
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <Field label="Priority" error={errors.priority}>
          <select
            className={inputClass}
            value={values.priority}
            onChange={(e) => set('priority', e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </select>
        </Field>

        {values.type === 'maintenance' && (
          <Field
            label="Equipment ID (optional)"
            error={errors.equipmentId}
            hint="ID of the affected equipment. Leave empty if unknown."
          >
            <input
              className={inputClass}
              inputMode="numeric"
              value={values.equipmentId}
              onChange={(e) => set('equipmentId', e.target.value)}
            />
          </Field>
        )}

        {values.type === 'access_permission' && (
          <>
            <Field label="Resource type *" error={errors.resourceType}>
              <select
                className={inputClass}
                value={values.resourceType}
                onChange={(e) => set('resourceType', e.target.value)}
              >
                <option value="">Select...</option>
                {RESOURCE_TYPES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Resource ID (optional)" error={errors.resourceId}>
              <input
                className={inputClass}
                inputMode="numeric"
                value={values.resourceId}
                onChange={(e) => set('resourceId', e.target.value)}
              />
            </Field>
            <Field label="Access expires on (optional)" error={errors.expiresAt}>
              <input
                type="date"
                className={inputClass}
                value={values.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
              />
            </Field>
          </>
        )}

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? 'Submitting...' : 'Submit request'}
          </button>
          <Link href="/requests" className="rounded-md border border-zinc-300 px-4 py-2 text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
