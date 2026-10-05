// components/ProfileForm.tsx
// The profile form shared by "Create profile" (/profile/setup, shown after the first login)
// and "Edit profile" (/profile/edit).
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { buttonStyles } from '@/components/ProfileCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch, imageUrl } from '@/lib/api';
import { PROFILE_LIMITS, ROLE_LABELS, validateProfile, type ProfileFields, type User } from '@/lib/users';

const AVATAR_MAX_MB = 2;
const BANNER_MAX_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type FieldErrors = Partial<Record<keyof ProfileFields | 'avatar' | 'banner', string>>;

function validateImage(file: File, maxMb: number): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Please choose a JPG, PNG or WEBP image.';
  if (file.size > maxMb * 1024 * 1024) return `The image must be ${maxMb} MB or smaller.`;
  return null;
}

/** Reads a picked image as a data URL so it can be previewed before saving. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function fieldsFrom(user: User): ProfileFields {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    studentId: user.studentId ?? '',
    phone: user.phone ?? '',
    department: user.department ?? '',
    bio: user.bio ?? '',
  };
}

export function ProfileForm({ mode }: { mode: 'setup' | 'edit' }) {
  const { user, setUser } = useCurrentUser();
  const router = useRouter();

  const [fields, setFields] = useState<ProfileFields>(() =>
    user ? fieldsFrom(user) : { firstName: '', lastName: '', studentId: '', phone: '', department: '', bio: '' },
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [resetBanner, setResetBanner] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const isSetup = mode === 'setup';
  const original = fieldsFrom(user);
  const changedFields = (Object.keys(fields) as (keyof ProfileFields)[]).filter(
    (k) => fields[k].trim() !== original[k].trim(),
  );
  const hasChanges = changedFields.length > 0 || !!avatarFile || !!bannerFile || resetBanner;
  const bannerShown = bannerPreview ?? (resetBanner ? null : imageUrl(user.bannerUrl));

  function setField(key: keyof ProfileFields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setSaved(false);
  }

  function pickAvatar(file: File | undefined) {
    setSaved(false);
    if (!file) return;
    const error = validateImage(file, AVATAR_MAX_MB);
    setErrors((e) => ({ ...e, avatar: error ?? undefined }));
    setAvatarFile(error ? null : file);
    setAvatarPreview(null);
    if (!error) readAsDataUrl(file).then(setAvatarPreview).catch(() => {});
  }

  function pickBanner(file: File | undefined) {
    setSaved(false);
    if (!file) return;
    const error = validateImage(file, BANNER_MAX_MB);
    setErrors((e) => ({ ...e, banner: error ?? undefined }));
    if (error) return;
    setBannerFile(file);
    setResetBanner(false);
    setBannerPreview(null);
    readAsDataUrl(file).then(setBannerPreview).catch(() => {});
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaved(false);

    const fieldErrors = validateProfile(fields);
    setErrors((prev) => ({ avatar: prev.avatar, banner: prev.banner, ...fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) return;

    setSaving(true);
    let latest: User = user!;
    try {
      // Upload images first so a failed upload doesn't mark the profile as complete.
      if (avatarFile) {
        latest = await apiFetch<User>('/api/users/me/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': avatarFile.type },
          body: avatarFile,
        });
        setUser(latest);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
      if (bannerFile) {
        latest = await apiFetch<User>('/api/users/me/banner', {
          method: 'PUT',
          headers: { 'Content-Type': bannerFile.type },
          body: bannerFile,
        });
        setUser(latest);
        setBannerFile(null);
        setBannerPreview(null);
      } else if (resetBanner) {
        latest = await apiFetch<User>('/api/users/me/banner', { method: 'DELETE' });
        setUser(latest);
        setResetBanner(false);
      }

      if (changedFields.length > 0 || isSetup) {
        const body: Record<string, unknown> = {};
        for (const key of changedFields) body[key] = fields[key].trim();
        if (isSetup) body.markProfileComplete = true;
        latest = await apiFetch<User>('/api/users/me', { method: 'PATCH', json: body });
        setUser(latest);
      }

      if (isSetup) {
        router.replace('/profile');
        return;
      }
      setFields(fieldsFrom(latest));
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (error?: string) =>
    `mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 dark:bg-zinc-950 dark:text-zinc-100 ${
      error
        ? 'border-red-400 focus:ring-red-200 dark:border-red-700 dark:focus:ring-red-900'
        : 'border-zinc-300 focus:border-emerald-500 focus:ring-emerald-100 dark:border-zinc-700 dark:focus:ring-emerald-900'
    }`;

  function textField(key: keyof ProfileFields, label: string, opts: { placeholder?: string; autoComplete?: string; required?: boolean; hint?: string; inputMode?: 'text' | 'tel' } = {}) {
    return (
      <Field label={label} required={opts.required} error={errors[key]} hint={opts.hint}>
        <input
          value={fields[key]}
          onChange={(e) => setField(key, e.target.value)}
          maxLength={PROFILE_LIMITS[key === 'firstName' || key === 'lastName' ? 'name' : (key as 'studentId' | 'phone' | 'department')]}
          placeholder={opts.placeholder}
          autoComplete={opts.autoComplete}
          inputMode={opts.inputMode}
          className={inputClass(errors[key])}
          aria-invalid={!!errors[key]}
        />
      </Field>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* Header */}
      {isSetup ? (
        <div className="rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 p-6 text-white sm:p-8">
          <p className="text-sm font-medium text-emerald-100">Welcome to Vase Lab</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Create your profile</h1>
          <p className="mt-2 max-w-xl text-sm text-emerald-50">
            Check your details so the lab team knows who you are. Only your name is required — you can change
            everything later from <span className="font-semibold">Edit profile</span>.
          </p>
          <p className="mt-3 text-xs text-emerald-100">
            Signed in as {user.email} · {ROLE_LABELS[user.role]}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Edit profile</h1>
            <p className="mt-1 text-sm text-zinc-500">Update your details and how you appear to the lab.</p>
          </div>
          <Link href="/profile" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            ← Back to profile
          </Link>
        </div>
      )}

      {/* Photo + name */}
      <Section title="Basic information">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:w-44">
            <Avatar user={user} size="xl" previewSrc={avatarPreview} />
            <input
              ref={avatarInput}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                pickAvatar(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div className="flex gap-2">
              <button type="button" className={buttonStyles.secondary} onClick={() => avatarInput.current?.click()}>
                {user.avatarUrl || avatarFile ? 'Change photo' : 'Add photo'}
              </button>
              {avatarFile && (
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                >
                  Undo
                </button>
              )}
            </div>
            <p className="text-center text-xs text-zinc-500">JPG, PNG or WEBP · up to {AVATAR_MAX_MB} MB</p>
            {errors.avatar && <p className="text-center text-xs text-red-600">{errors.avatar}</p>}
          </div>

          <div className="grid flex-1 grid-cols-1 content-start gap-4 sm:grid-cols-2">
            {textField('firstName', 'First name', { autoComplete: 'given-name', required: true })}
            {textField('lastName', 'Last name', { autoComplete: 'family-name', required: true })}
            <div className="sm:col-span-2">
              <Field label="Email" hint="Comes from your Google account and can't be changed here.">
                <input value={user.email} disabled className={`${inputClass()} cursor-not-allowed opacity-70`} />
              </Field>
            </div>
          </div>
        </div>
      </Section>

      {/* Lab details */}
      <Section
        title="Lab details"
        description="Your student / staff ID and phone number are only shown to you and the Lab Manager."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {textField('studentId', 'Student / staff ID', { placeholder: 'e.g. 6710545725' })}
          {textField('phone', 'Phone number', { placeholder: 'e.g. 081-234-5678', autoComplete: 'tel', inputMode: 'tel' })}
          <div className="sm:col-span-2">
            {textField('department', 'Faculty / department / program', { placeholder: 'e.g. Software and Knowledge Engineering' })}
          </div>
        </div>
      </Section>

      {/* Bio */}
      <Section title="About you">
        <Field label="Short bio" error={errors.bio} hint={`${fields.bio.trim().length}/${PROFILE_LIMITS.bio} characters`}>
          <textarea
            value={fields.bio}
            onChange={(e) => setField('bio', e.target.value)}
            maxLength={PROFILE_LIMITS.bio}
            rows={4}
            placeholder="What you work on in the lab, your research interests…"
            className={`${inputClass(errors.bio)} resize-y`}
            aria-invalid={!!errors.bio}
          />
        </Field>
      </Section>

      {/* Banner */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div
          className="h-32 bg-linear-to-r from-emerald-500 to-teal-600 bg-cover bg-center sm:h-40"
          style={bannerShown ? { backgroundImage: `url("${bannerShown}")` } : undefined}
          role="img"
          aria-label="Banner preview"
        />
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Profile banner</h2>
            <p className="text-xs text-zinc-500">Optional. JPG, PNG or WEBP, up to {BANNER_MAX_MB} MB. A wide image (about 3:1) looks best.</p>
            {resetBanner && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">The default banner will be restored when you save.</p>}
            {errors.banner && <p className="mt-1 text-xs text-red-600">{errors.banner}</p>}
          </div>
          <div className="flex gap-2">
            <input
              ref={bannerInput}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                pickBanner(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button type="button" className={buttonStyles.secondary} onClick={() => bannerInput.current?.click()}>
              Change banner
            </button>
            {bannerFile ? (
              <button
                type="button"
                className={buttonStyles.secondary}
                onClick={() => {
                  setBannerFile(null);
                  setBannerPreview(null);
                }}
              >
                Undo
              </button>
            ) : (
              !resetBanner &&
              !isSetup && (
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  onClick={() => {
                    setResetBanner(true);
                    setSaved(false);
                  }}
                >
                  Use default
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {formError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {formError}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && !hasChanges && (
          <span role="status" className="mr-auto text-sm font-medium text-emerald-700 dark:text-emerald-400">
            ✓ Profile saved
          </span>
        )}
        {!isSetup && (
          <button type="button" className={buttonStyles.secondary} onClick={() => router.push('/profile')}>
            {saved && !hasChanges ? 'Done' : 'Cancel'}
          </button>
        )}
        <button type="submit" className={buttonStyles.primary} disabled={saving || (!isSetup && !hasChanges)}>
          {saving ? 'Saving…' : isSetup ? 'Create profile' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>
      )}
    </label>
  );
}
