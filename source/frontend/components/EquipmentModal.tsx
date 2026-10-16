// components/EquipmentModal.tsx the pop-up used to add a new equipment item or edit an existing one.
'use client';
 
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { CloseIcon } from '@/components/equipmentIcons';
import { EquipmentPhoto } from '@/components/EquipmentPhoto';
import { ApiError, apiFetch } from '@/lib/api';
import {
  EMPTY_EQUIPMENT_FIELDS,
  EQUIPMENT_LIMITS,
  fieldsFromEquipment,
  toRequestBody,
  validateEquipment,
  type Equipment,
  type EquipmentErrors,
  type EquipmentFields,
} from '@/lib/equipment';
import { ui } from '@/lib/ui';
 
const PHOTO_MAX_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
 
function validatePhoto(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WEBP image.';
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `Choose an image of ${PHOTO_MAX_MB} MB or less.`;
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
 
type Props = {
  /** the item to edit, or null to add a new one */
  item: Equipment | null;
  onClose: () => void;
  /** called after a successful save; `notice` is the message the page shows */
  onSaved: (notice: string) => void;
};
 
export function EquipmentModal({ item, onClose, onSaved }: Props) {
  const isEdit = item !== null;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
 
  const initial = item ? fieldsFromEquipment(item) : EMPTY_EQUIPMENT_FIELDS;
  const [fields, setFields] = useState<EquipmentFields>(initial);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
 
  const [errors, setErrors] = useState<EquipmentErrors & { photo?: string }>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
 
  const dirty =
    (Object.keys(fields) as (keyof EquipmentFields)[]).some((k) => fields[k].trim() !== initial[k].trim()) ||
    !!photoFile ||
    removePhoto;
 
  function requestClose() {
    if (saving) return;
    if (dirty && !window.confirm('Discard your changes?')) return;
    onClose();
  }
 
  // Keep the latest requestClose for the key handler below without re-registering it on every render.
  const closeRef = useRef(requestClose);
  useEffect(() => {
    closeRef.current = requestClose;
  });
 
  // While the pop-up is open: lock page scrolling, focus the name field, and give focus back afterwards.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    nameRef.current?.focus();
 
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);
 
  /** Tab / Shift+Tab stay inside the pop-up. */
  function trapFocus(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]):not([type="file"]), textarea:not([disabled]), [href], select:not([disabled])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
 
  function setField(key: keyof EquipmentFields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }
 
  function pickPhoto(file: File | undefined) {
    if (!file) return;
    const error = validatePhoto(file);
    setErrors((e) => ({ ...e, photo: error ?? undefined }));
    if (error) return;
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoPreview(null);
    readAsDataUrl(file).then(setPhotoPreview).catch(() => {});
  }
 
  function keepCurrentPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(false);
  }
 
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
 
    const fieldErrors = validateEquipment(fields);
    setErrors((prev) => ({ photo: prev.photo, ...fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) return;
 
    setSaving(true);
 
    // 1) save the text fields
    let saved: Equipment;
    try {
      saved = await apiFetch<Equipment>(isEdit ? `/api/equipment/${item.equipmentId}` : '/api/equipment', {
        method: isEdit ? 'PATCH' : 'POST',
        json: toRequestBody(fields),
      });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'The equipment could not be saved. Try again.');
      setSaving(false);
      return;
    }
 
    // 2) then the photo. If only this step fails, the item is still saved, so we tell the page about it.
    let notice = isEdit ? `${saved.name} was updated` : `${saved.name} was added`;
    try {
      if (photoFile) {
        saved = await apiFetch<Equipment>(`/api/equipment/${saved.equipmentId}/image`, {
          method: 'PUT',
          headers: { 'Content-Type': photoFile.type },
          body: photoFile,
        });
      } else if (removePhoto && item?.imageUrl) {
        saved = await apiFetch<Equipment>(`/api/equipment/${saved.equipmentId}/image`, { method: 'DELETE' });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      notice = `${saved.name} was saved, but the photo could not be updated (${reason}). Open Edit to try again.`;
    }
 
    setSaving(false);
    onSaved(notice);
  }
 
  const hasSavedPhoto = !!item?.imageUrl && !removePhoto;
  const hasAnyPhoto = !!photoFile || hasSavedPhoto;
  const name = fields.name.trim() || 'new equipment';
 
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose(); // click on the dark backdrop
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
        className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)] dark:bg-[#1e1f20] dark:ring-1 dark:ring-[#3c4043]"
      >
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
            <div>
              <h2 id={titleId} className="text-[22px] leading-7">
                {isEdit ? 'Edit equipment' : 'Add equipment'}
              </h2>
              <p className={`mt-1 text-sm ${ui.muted}`}>
                {isEdit ? 'Changes show up for everyone in the lab.' : 'Only the name is required.'}
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className={`-mt-1 -mr-2 rounded-full p-2 text-[#5f6368] dark:text-[#9aa0a6] ${ui.hover} ${ui.focus}`}
            >
              <CloseIcon />
            </button>
          </div>
 
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
            {/* Photo */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <EquipmentPhoto
                src={removePhoto ? null : item?.imageUrl}
                previewSrc={photoPreview}
                name={name}
                size="lg"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <button type="button" className={ui.btnOutline} onClick={() => photoInput.current?.click()}>
                    {hasAnyPhoto ? 'Change photo' : 'Add photo'}
                  </button>
                  {photoFile ? (
                    <button type="button" className={ui.btnText} onClick={keepCurrentPhoto}>
                      {isEdit && item?.imageUrl ? 'Keep current photo' : 'Remove'}
                    </button>
                  ) : (
                    hasSavedPhoto && (
                      <button type="button" className={ui.btnDanger} onClick={() => setRemovePhoto(true)}>
                        Remove photo
                      </button>
                    )
                  )}
                </div>
                <p className={`mt-1.5 text-xs ${ui.muted}`}>
                  {removePhoto ? 'The photo will be removed when you save.' : `JPG, PNG or WEBP, up to ${PHOTO_MAX_MB} MB`}
                </p>
                {errors.photo && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.photo}</p>}
              </div>
              <input
                ref={photoInput}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
 
            <Field label="Name" required error={errors.name}>
              <input
                ref={nameRef}
                value={fields.name}
                onChange={(e) => setField('name', e.target.value)}
                maxLength={EQUIPMENT_LIMITS.name}
                placeholder="e.g. Digital microscope"
                className={`${ui.input} ${errors.name ? ui.inputError : ''}`}
                aria-invalid={!!errors.name}
              />
            </Field>
 
            <Field
              label="Description"
              error={errors.description}
              hint={`${fields.description.trim().length} / ${EQUIPMENT_LIMITS.description}`}
            >
              <textarea
                value={fields.description}
                onChange={(e) => setField('description', e.target.value)}
                maxLength={EQUIPMENT_LIMITS.description}
                rows={3}
                placeholder="What it is used for"
                className={`${ui.input} resize-y`}
              />
            </Field>
 
            <Field label="Location" error={errors.location}>
              <input
                value={fields.location}
                onChange={(e) => setField('location', e.target.value)}
                maxLength={EQUIPMENT_LIMITS.location}
                placeholder="e.g. Room 101, shelf B"
                className={ui.input}
              />
            </Field>
 
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Total quantity" error={errors.quantityTotal}>
                <input
                  value={fields.quantityTotal}
                  onChange={(e) => setField('quantityTotal', e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  placeholder="0"
                  className={`${ui.input} ${errors.quantityTotal ? ui.inputError : ''}`}
                  aria-invalid={!!errors.quantityTotal}
                />
              </Field>
              <Field
                label="Available now"
                error={errors.quantityAvailable}
                hint={isEdit ? undefined : 'Leave empty to make all of them available.'}
              >
                <input
                  value={fields.quantityAvailable}
                  onChange={(e) => setField('quantityAvailable', e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  placeholder={isEdit ? '0' : 'Same as total'}
                  className={`${ui.input} ${errors.quantityAvailable ? ui.inputError : ''}`}
                  aria-invalid={!!errors.quantityAvailable}
                />
              </Field>
            </div>
 
            {formError && (
              <p role="alert" className="rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
                {formError}
              </p>
            )}
          </div>
 
          <div className={`flex items-center justify-end gap-2 border-t px-6 py-4 ${ui.border}`}>
            <button type="button" className={ui.btnText} onClick={requestClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={ui.btnPrimary} disabled={saving || (isEdit && !dirty)}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
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