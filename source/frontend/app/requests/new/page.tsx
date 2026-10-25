// app/requests/new/page.tsx  ->  /requests/new
// Submit-request form.
'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/ProfileView';
import { ApiError, apiFetch } from '@/lib/api';
import {
  FORM_TYPES,
  LIMITS,
  PRIORITIES,
  PRIORITY_LABELS,
  RESOURCE_LABELS,
  RESOURCE_TYPES,
  emptyForm,
  toPayload,
  validateForm,
  type FormErrors,
  type FormValues,
  type RequestDetailResponse,
} from '@/lib/requests';
import { ui } from '@/lib/ui';

const control = (error?: string) => `${ui.input} ${error ? ui.inputError : ''}`;

function Field({
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

export default function NewRequestPage() {
  return (
    <AppShell>
      <NewRequestForm />
    </AppShell>
  );
}

function NewRequestForm() {
  const router = useRouter();
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
      const { request } = await apiFetch<RequestDetailResponse>('/api/requests', {
        method: 'POST',
        json: toPayload(values),
      });
      router.push(`/requests/${request.requestId}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details as FormErrors); // messages from the server
      else setFormError(err instanceof Error ? err.message : 'The request could not be submitted');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/requests" className={`${ui.link} mb-4 inline-block text-sm`}>
        Back to requests
      </Link>
      <PageHeading title="Submit a request" subtitle="Tell the lab team what you need. You can follow its progress afterwards." />

      <form onSubmit={handleSubmit} noValidate className={`space-y-5 p-6 ${ui.card}`}>
        <Field label="What is this about?" htmlFor="type" error={errors.type}>
          <select id="type" className={`${ui.select} w-full`} value={values.type} onChange={(e) => set('type', e.target.value)}>
            {FORM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title" htmlFor="title" error={errors.title}>
          <input
            id="title"
            className={control(errors.title)}
            value={values.title}
            maxLength={LIMITS.titleMax}
            placeholder="e.g. Microscope lens is cracked"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
            onChange={(e) => set('title', e.target.value)}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={errors.description}
          hint={`${values.description.length} of ${LIMITS.descMax} characters`}
        >
          <textarea
            id="description"
            className={control(errors.description)}
            rows={4}
            value={values.description}
            maxLength={LIMITS.descMax}
            placeholder="What do you need, or what went wrong?"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-error' : undefined}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <Field label="Priority" htmlFor="priority" error={errors.priority}>
          <select id="priority" className={`${ui.select} w-full`} value={values.priority} onChange={(e) => set('priority', e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>

        {values.type === 'maintenance' && (
          <Field
            label="Equipment number (optional)"
            htmlFor="equipmentId"
            error={errors.equipmentId}
            hint="The number of the affected item. Leave empty if you do not know it."
          >
            <input
              id="equipmentId"
              className={control(errors.equipmentId)}
              inputMode="numeric"
              value={values.equipmentId}
              aria-invalid={!!errors.equipmentId}
              aria-describedby={errors.equipmentId ? 'equipmentId-error' : undefined}
              onChange={(e) => set('equipmentId', e.target.value)}
            />
          </Field>
        )}

        {values.type === 'access_permission' && (
          <>
            <Field label="Access to" htmlFor="resourceType" error={errors.resourceType}>
              <select
                id="resourceType"
                className={`${ui.select} w-full`}
                value={values.resourceType}
                onChange={(e) => set('resourceType', e.target.value)}
              >
                <option value="">Choose one</option>
                {RESOURCE_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {RESOURCE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Item number (optional)" htmlFor="resourceId" error={errors.resourceId}>
              <input
                id="resourceId"
                className={control(errors.resourceId)}
                inputMode="numeric"
                value={values.resourceId}
                aria-invalid={!!errors.resourceId}
                aria-describedby={errors.resourceId ? 'resourceId-error' : undefined}
                onChange={(e) => set('resourceId', e.target.value)}
              />
            </Field>
            <Field label="Access ends on (optional)" htmlFor="expiresAt" error={errors.expiresAt}>
              <input
                id="expiresAt"
                type="date"
                className={control(errors.expiresAt)}
                value={values.expiresAt}
                aria-invalid={!!errors.expiresAt}
                aria-describedby={errors.expiresAt ? 'expiresAt-error' : undefined}
                onChange={(e) => set('expiresAt', e.target.value)}
              />
            </Field>
          </>
        )}

        {formError && (
          <p role="alert" className="rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="submit" disabled={submitting} className={ui.btnPrimary}>
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
          <Link href="/requests" className={ui.btnOutline}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
