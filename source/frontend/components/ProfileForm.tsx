// components/ProfileForm.tsx
// The profile form shared by "Create profile" (/profile/setup, shown after the first login)
// and "Edit profile" (/profile/edit).
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { ArrowBackIcon, CameraIcon, VaseMark } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch, imageUrl } from '@/lib/api';
import { ui } from '@/lib/ui';
import { PROFILE_LIMITS, ROLE_LABELS, validateProfile, type ProfileFields, type User } from '@/lib/users';

const AVATAR_MAX_MB = 2;
const BANNER_MAX_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type FieldErrors = Partial<Record<keyof ProfileFields | 'avatar' | 'banner', string>>;

function validateImage(file: File, maxMb: number): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WEBP image.';
  if (file.size > maxMb * 1024 * 1024) return `Choose an image of ${maxMb} MB or less.`;
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

const EMPTY_FIELDS: ProfileFields = { firstName: '', lastName: '', studentId: '', phone: '', department: '', bio: '' };

export function ProfileForm({ mode }: { mode: 'setup' | 'edit' }) {
  const { user, setUser } = useCurrentUser();
  const router = useRouter();

  const [fields, setFields] = useState<ProfileFields>(() => (user ? fieldsFrom(user) : EMPTY_FIELDS));
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

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
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
      // Upload images first so a failed upload doesn't mark the profile as created.
      if (avatarFile) {
        latest = await apiFetch<User>('/api/users/me/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': avatarFile.type },
          body: avatarFile,
        });
        setUser(latest);
        clearAvatar();
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
      setFormError(err instanceof Error ? err.message : 'Your profile could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function textInput(key: keyof ProfileFields, label: string, opts: { placeholder?: string; autoComplete?: string; required?: boolean; hint?: string; type?: string } = {}) {
    const max = key === 'firstName' || key === 'lastName' ? PROFILE_LIMITS.name : PROFILE_LIMITS[key as 'studentId' | 'phone' | 'department'];
    return (
      <Field label={label} required={opts.required} error={errors[key]} hint={opts.hint}>
        <input
          type={opts.type ?? 'text'}
          value={fields[key]}
          onChange={(e) => setField(key, e.target.value)}
          maxLength={max}
          placeholder={opts.placeholder}
          autoComplete={opts.autoComplete}
          className={`${ui.input} ${errors[key] ? ui.inputError : ''}`}
          aria-invalid={!!errors[key]}
        />
      </Field>
    );
  }

  const photoPicker = (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => avatarInput.current?.click()}
        className={`group relative rounded-full ${ui.focus}`}
        aria-label={user.avatarUrl || avatarFile ? 'Change profile picture' : 'Add profile picture'}
      >
        <Avatar user={user} size="lg" previewSrc={avatarPreview} />
        <span className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#444746] group-hover:bg-[#f1f3f4] dark:border-[#3c4043] dark:bg-[#1f1f1f] dark:text-[#e3e3e3]">
          <CameraIcon width={16} height={16} />
        </span>
      </button>
      <div className="min-w-0">
        <p className="text-sm">Profile picture</p>
        <p className={`text-xs ${ui.muted}`}>JPG, PNG or WEBP, up to {AVATAR_MAX_MB} MB</p>
        {avatarFile && (
          <button type="button" onClick={clearAvatar} className={`${ui.link} mt-1 text-xs`}>
            Keep current picture
          </button>
        )}
        {errors.avatar && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.avatar}</p>}
      </div>
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
    </div>
  );

  const nameFields = (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {textInput('firstName', 'First name', { autoComplete: 'given-name', required: true })}
      {textInput('lastName', 'Last name', { autoComplete: 'family-name', required: true })}
    </div>
  );

  const labFields = (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {textInput('studentId', 'Student / staff ID', { placeholder: '6710545725' })}
      {textInput('phone', 'Phone number', { placeholder: '081 234 5678', autoComplete: 'tel', type: 'tel' })}
      <div className="sm:col-span-2">
        {textInput('department', 'Faculty / department', { placeholder: 'Software and Knowledge Engineering' })}
      </div>
    </div>
  );

  const bioField = (
    <Field label="About" error={errors.bio} hint={`${fields.bio.trim().length} / ${PROFILE_LIMITS.bio}`}>
      <textarea
        value={fields.bio}
        onChange={(e) => setField('bio', e.target.value)}
        maxLength={PROFILE_LIMITS.bio}
        rows={4}
        placeholder="What you work on in the lab"
        className={`${ui.input} resize-y ${errors.bio ? ui.inputError : ''}`}
        aria-invalid={!!errors.bio}
      />
    </Field>
  );

  const errorBanner = formError && (
    <p role="alert" className="rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
      {formError}
    </p>
  );

  // ---------- Create profile: one centred card, like an account sign-up step ----------
  if (isSetup) {
    return (
      <form onSubmit={onSubmit} noValidate className={`mx-auto max-w-[520px] px-6 py-9 sm:px-10 sm:py-12 ${ui.card}`}>
        <VaseMark width={32} height={32} className="text-[#1558b0] dark:text-[#a8c7fa]" />
        <h1 className="mt-5 text-[28px] leading-9">Create your profile</h1>
        <p className={`mt-2 text-base ${ui.muted}`}>
          Tell the lab team who you are. Only your name is required; you can change everything later.
        </p>
        <p className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm ${ui.border}`}>
          {user.email} ({ROLE_LABELS[user.role]})
        </p>

        <div className="mt-8 space-y-6">
          {photoPicker}
          {nameFields}
          {labFields}
          {bioField}
          <p className={`text-xs ${ui.muted}`}>Your student / staff ID and phone number are only visible to you and the Lab Manager.</p>
          {errorBanner}
        </div>

        <div className="mt-8 flex justify-end">
          <button type="submit" className={ui.btnPrimary} disabled={saving}>
            {saving ? 'Creating…' : 'Create profile'}
          </button>
        </div>
      </form>
    );
  }

  // ---------- Edit profile ----------
  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/profile" aria-label="Back to personal info" className={`rounded-full p-2 ${ui.hover} ${ui.focus}`}>
          <ArrowBackIcon />
        </Link>
        <h1 className="text-[22px] leading-7">Edit profile</h1>
      </div>

      <Section title="Profile picture and banner">
        {photoPicker}
        <div className="mt-6">
          <div
            className="h-24 rounded-lg bg-[#e8eaed] bg-cover bg-center sm:h-28 dark:bg-[#303134]"
            style={bannerShown ? { backgroundImage: `url("${bannerShown}")` } : undefined}
            role="img"
            aria-label="Banner preview"
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <button type="button" className={ui.btnText} onClick={() => bannerInput.current?.click()}>
              Change banner
            </button>
            {bannerFile ? (
              <button
                type="button"
                className={ui.btnText}
                onClick={() => {
                  setBannerFile(null);
                  setBannerPreview(null);
                }}
              >
                Keep current banner
              </button>
            ) : (
              !resetBanner && (
                <button
                  type="button"
                  className={ui.btnText}
                  onClick={() => {
                    setResetBanner(true);
                    setSaved(false);
                  }}
                >
                  Use default banner
                </button>
              )
            )}
            <span className={`text-xs ${ui.muted}`}>
              {resetBanner ? 'The default banner will be used when you save.' : `Wide image, up to ${BANNER_MAX_MB} MB`}
            </span>
          </div>
          {errors.banner && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.banner}</p>}
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
        </div>
      </Section>

      <Section title="Basic info" description="Other people in the lab can see this information.">
        <div className="space-y-5">
          {nameFields}
          <Field label="Email" hint="Managed by your Google account.">
            <input value={user.email} disabled className={ui.input} />
          </Field>
          {bioField}
        </div>
      </Section>

      <Section title="Contact info and ID" description="Only you and the Lab Manager can see your student / staff ID and phone number.">
        {labFields}
      </Section>

      <div className="mt-6">{errorBanner}</div>

      <div className={`sticky bottom-0 mt-6 flex items-center justify-end gap-2 border-t bg-white py-4 dark:bg-[#1f1f1f] ${ui.border}`}>
        {saved && !hasChanges && (
          <span role="status" className={`mr-auto text-sm ${ui.muted}`}>
            Changes saved
          </span>
        )}
        <Link href="/profile" className={ui.btnText}>
          {saved && !hasChanges ? 'Done' : 'Cancel'}
        </Link>
        <button type="submit" className={ui.btnPrimary} disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={`mt-6 px-6 py-6 ${ui.card}`}>
      <h2 className="text-[22px] leading-7">{title}</h2>
      {description && <p className={`mt-1 text-sm ${ui.muted}`}>{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
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
