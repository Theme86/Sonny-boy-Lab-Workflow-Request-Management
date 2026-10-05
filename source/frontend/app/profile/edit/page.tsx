// app/profile/edit/page.tsx — edit my name, profile picture and banner
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { buttonStyles } from '@/components/ProfileCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch, imageUrl } from '@/lib/api';
import type { User } from '@/lib/users';

const AVATAR_MAX_MB = 2;
const BANNER_MAX_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const NAME_MAX = 100;

export default function EditProfilePage() {
  return (
    <AppShell>
      <EditProfileForm />
    </AppShell>
  );
}

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

function EditProfileForm() {
  const { user, setUser } = useCurrentUser();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [resetBanner, setResetBanner] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; avatar?: string; banner?: string }>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  if (!user) return null;

  const nameChanged = firstName.trim() !== user.firstName || lastName.trim() !== user.lastName;
  const hasChanges = nameChanged || !!avatarFile || !!bannerFile || resetBanner;
  const bannerShown = bannerPreview ?? (resetBanner ? null : imageUrl(user.bannerUrl));

  function pickAvatar(file: File | undefined) {
    setSaved(false);
    if (!file) return;
    const error = validateImage(file, AVATAR_MAX_MB);
    setFieldErrors((e) => ({ ...e, avatar: error ?? undefined }));
    setAvatarFile(error ? null : file);
    setAvatarPreview(null);
    if (!error) readAsDataUrl(file).then(setAvatarPreview).catch(() => {});
  }

  function pickBanner(file: File | undefined) {
    setSaved(false);
    if (!file) return;
    const error = validateImage(file, BANNER_MAX_MB);
    setFieldErrors((e) => ({ ...e, banner: error ?? undefined }));
    if (!error) {
      setBannerFile(file);
      setResetBanner(false);
      setBannerPreview(null);
      readAsDataUrl(file).then(setBannerPreview).catch(() => {});
    }
  }

  function validateNames() {
    const errors: { firstName?: string; lastName?: string } = {};
    if (!firstName.trim()) errors.firstName = 'First name is required.';
    else if (firstName.trim().length > NAME_MAX) errors.firstName = `At most ${NAME_MAX} characters.`;
    if (!lastName.trim()) errors.lastName = 'Last name is required.';
    else if (lastName.trim().length > NAME_MAX) errors.lastName = `At most ${NAME_MAX} characters.`;
    setFieldErrors((e) => ({ ...e, ...errors, firstName: errors.firstName, lastName: errors.lastName }));
    return !errors.firstName && !errors.lastName;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaved(false);
    if (!validateNames()) return;

    setSaving(true);
    let latest: User = user!;
    try {
      if (nameChanged) {
        latest = await apiFetch<User>('/api/users/me', {
          method: 'PATCH',
          json: { firstName: firstName.trim(), lastName: lastName.trim() },
        });
        setUser(latest);
      }
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
      setFirstName(latest.firstName);
      setLastName(latest.lastName);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (hasError?: string) =>
    `mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 dark:bg-zinc-950 dark:text-zinc-100 ${
      hasError
        ? 'border-red-400 focus:ring-red-200 dark:border-red-700 dark:focus:ring-red-900'
        : 'border-zinc-300 focus:border-emerald-500 focus:ring-emerald-100 dark:border-zinc-700 dark:focus:ring-emerald-900'
    }`;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Edit profile</h1>
          <p className="mt-1 text-sm text-zinc-500">Update your name and how you appear to the lab.</p>
        </div>
        <Link href="/profile" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← Back to profile
        </Link>
      </div>

      {/* Banner */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div
          className="h-36 bg-linear-to-r from-emerald-500 to-teal-600 bg-cover bg-center sm:h-44"
          style={bannerShown ? { backgroundImage: `url("${bannerShown}")` } : undefined}
          role="img"
          aria-label="Banner preview"
        />
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Banner</h2>
            <p className="text-xs text-zinc-500">JPG, PNG or WEBP, up to {BANNER_MAX_MB} MB. A wide image (about 3:1) looks best.</p>
            {resetBanner && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">The default banner will be restored when you save.</p>}
            {fieldErrors.banner && <p className="mt-1 text-xs text-red-600">{fieldErrors.banner}</p>}
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
              <button type="button" className={buttonStyles.secondary} onClick={() => {
                  setBannerFile(null);
                  setBannerPreview(null);
                }}>
                Undo
              </button>
            ) : (
              !resetBanner && (
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

      {/* Avatar + name */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
                Change photo
              </button>
              {avatarFile && (
                <button type="button" className={buttonStyles.secondary} onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}>
                  Undo
                </button>
              )}
            </div>
            <p className="text-center text-xs text-zinc-500">Up to {AVATAR_MAX_MB} MB</p>
            {fieldErrors.avatar && <p className="text-center text-xs text-red-600">{fieldErrors.avatar}</p>}
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">First name</span>
              <input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setSaved(false);
                }}
                maxLength={NAME_MAX}
                autoComplete="given-name"
                className={inputClass(fieldErrors.firstName)}
                aria-invalid={!!fieldErrors.firstName}
              />
              {fieldErrors.firstName && <span className="mt-1 block text-xs text-red-600">{fieldErrors.firstName}</span>}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Last name</span>
              <input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setSaved(false);
                }}
                maxLength={NAME_MAX}
                autoComplete="family-name"
                className={inputClass(fieldErrors.lastName)}
                aria-invalid={!!fieldErrors.lastName}
              />
              {fieldErrors.lastName && <span className="mt-1 block text-xs text-red-600">{fieldErrors.lastName}</span>}
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Email</span>
              <input value={user.email} disabled className={`${inputClass()} cursor-not-allowed opacity-70`} />
              <span className="mt-1 block text-xs text-zinc-500">Comes from your Google account and can&apos;t be changed here.</span>
            </label>
          </div>
        </div>
      </section>

      {formError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && !hasChanges && (
          <span role="status" className="mr-auto text-sm font-medium text-emerald-700 dark:text-emerald-400">
            ✓ Profile saved
          </span>
        )}
        <button type="button" className={buttonStyles.secondary} onClick={() => router.push('/profile')}>
          {saved && !hasChanges ? 'Done' : 'Cancel'}
        </button>
        <button type="submit" className={buttonStyles.primary} disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
