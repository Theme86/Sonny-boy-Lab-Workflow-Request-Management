'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch, imageUrl as resolveImageUrl } from '@/lib/api';
import { ui } from '@/lib/ui';

/* ============================================================================
   Types
   ========================================================================== */

const UNITS = ['ml', 'l', 'g', 'kg', 'pieces'] as const;
const UNIT_LABELS: Record<string, string> = {
  ml: 'Milliliter (ml)',
  l: 'Liter (l)',
  g: 'Gram (g)',
  kg: 'Kilogram (kg)',
  pieces: 'Pieces',
};
const unitLabel = (u: string) => UNIT_LABELS[u] ?? u;

type Hazard = { hazardId: number; code: string; name: string };

type Consumable = {
  consumableId: number;
  name: string;
  description: string | null;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  phValue: number | null;
  expiryDate: string | null; // "YYYY-MM-DD"
  imageUrl: string | null;
  hazards: Hazard[];
};

type ApiConsumable = Omit<Consumable, 'currentStock' | 'reorderThreshold' | 'phValue' | 'hazards'> & {
  currentStock: string | number;
  reorderThreshold: string | number;
  phValue: string | number | null;
  hazards?: Hazard[];
};

// Prisma Decimal arrives as a string and dates as full ISO strings.
function fromApi(r: ApiConsumable): Consumable {
  return {
    ...r,
    currentStock: Number(r.currentStock),
    reorderThreshold: Number(r.reorderThreshold),
    phValue: r.phValue == null ? null : Number(r.phValue),
    expiryDate: r.expiryDate ? r.expiryDate.slice(0, 10) : null,
    hazards: r.hazards ?? [],
  };
}

type SavePayload = {
  name: string;
  description: string | null;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  phValue: number | null;
  expiryDate: string | null;
  imageUrl: string | null;
};

/* ============================================================================
   Helpers
   ========================================================================== */

const EXPIRY_SOON_DAYS = 30;
const DAY_MS = 86_400_000;
const PHOTO_MAX_MB = 5;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validatePhoto(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WEBP image.';
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `Choose an image of ${PHOTO_MAX_MB} MB or less.`;
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toLocalDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}
function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toLocalDate(iso).getTime() - today.getTime()) / DAY_MS);
}
function formatDate(iso: string | null) {
  if (!iso) return '—';
  return toLocalDate(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
const fmtNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

type StockStatus = 'in' | 'low' | 'out';
function stockStatus(c: Consumable): StockStatus {
  if (c.currentStock <= 0) return 'out';
  if (c.currentStock <= c.reorderThreshold) return 'low';
  return 'in';
}

type ExpiryStatus = 'none' | 'ok' | 'soon' | 'expired';
function expiryStatus(c: Consumable): ExpiryStatus {
  if (!c.expiryDate) return 'none';
  const d = daysUntil(c.expiryDate);
  if (d < 0) return 'expired';
  if (d <= EXPIRY_SOON_DAYS) return 'soon';
  return 'ok';
}

/* ============================================================================
   Shared styles (built on lib/ui.ts so the page matches the rest of the app)
   ========================================================================== */

const btn = {
  primary: ui.btnPrimary,
  secondary: ui.btnOutline,
  danger: `inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#b3261e] px-6 text-sm font-medium text-white transition-colors hover:bg-[#9c2019] dark:bg-[#f2b8b5] dark:text-[#601410] ${ui.focus}`,
  dangerText: ui.btnDanger,
};

function inputClass(invalid = false) {
  return `${ui.input} ${invalid ? ui.inputError : ''}`;
}
const selectCls = ui.select;
const labelCls = 'text-sm font-medium';
const headCellBg = 'bg-[#f8f9fa] dark:bg-[#28292a]';

/* ============================================================================
   Icons
   ========================================================================== */

type IconName =
  | 'plus' | 'search' | 'pencil' | 'trash' | 'x' | 'eye' | 'grid' | 'list'
  | 'alert' | 'clock' | 'package' | 'flask' | 'ban' | 'info' | 'link';

const ICONS: Record<IconName, ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  pencil: <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  trash: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>),
  grid: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  alert: <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01" />,
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  package: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7 12 12l8.7-5M12 22V12" />,
  flask: <path d="M9 3h6M10 3v6.5L4.6 18.4A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.4-2.6L14 9.5V3M7 15h10" />,
  ban: (<><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>),
  link: <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />,
};

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function IconButton({ icon, label, onClick, danger = false }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`grid h-8 w-8 place-items-center rounded-full ${ui.muted} transition ${ui.focus} ${
        danger ? 'hover:bg-[#b3261e]/10 hover:text-[#b3261e]' : ui.hover
      }`}
    >
      <Icon name={icon} />
    </button>
  );
}

/* ============================================================================
   Small display components
   ========================================================================== */

type Tone = 'green' | 'amber' | 'red' | 'gray';
const BADGE_TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
  gray: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/10 dark:text-gray-300',
};

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

function StockBadge({ c }: { c: Consumable }) {
  const s = stockStatus(c);
  if (s === 'out') return <Badge tone="red"><Dot className="bg-red-500" />Out of stock</Badge>;
  if (s === 'low') return <Badge tone="amber"><Dot className="bg-amber-500" />Low stock</Badge>;
  return <Badge tone="green"><Dot className="bg-emerald-500" />In stock</Badge>;
}

function ExpiryBadge({ c }: { c: Consumable }) {
  const s = expiryStatus(c);
  if (!c.expiryDate || s === 'none' || s === 'ok') return null;
  const d = daysUntil(c.expiryDate);
  if (s === 'expired') return <Badge tone="red"><Icon name="ban" className="h-3 w-3" />Expired</Badge>;
  return <Badge tone="amber"><Icon name="clock" className="h-3 w-3" />{d === 0 ? 'Expires today' : `Expires in ${d}d`}</Badge>;
}

function StockCell({ c }: { c: Consumable }) {
  const s = stockStatus(c);
  const max = Math.max(c.reorderThreshold * 3, c.currentStock, 1);
  const pct = Math.min(100, (c.currentStock / max) * 100);
  const bar = s === 'out' ? 'bg-red-500' : s === 'low' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="min-w-[150px]">
      <div className="flex items-baseline gap-1">
        <span className="font-medium tabular-nums">{fmtNum(c.currentStock)}</span>
        <span className={`text-xs ${ui.muted}`}>{c.unit}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e8eaed] dark:bg-[#3c4043]">
        <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${Math.max(pct, s === 'out' ? 0 : 3)}%` }} />
      </div>
      <div className={`mt-1 text-[11px] ${ui.muted}`}>
        Reorder at {fmtNum(c.reorderThreshold)} {c.unit}
      </div>
    </div>
  );
}

function ExpiryCell({ c }: { c: Consumable }) {
  if (!c.expiryDate) return <span className={`text-sm ${ui.muted}`}>No expiry</span>;
  const d = daysUntil(c.expiryDate);
  const s = expiryStatus(c);
  const sub =
    s === 'expired'
      ? `Expired ${Math.abs(d)}d ago`
      : d === 0
        ? 'Expires today'
        : d > 60
          ? `in ${Math.round(d / 30)} months`
          : `in ${d} days`;
  const subCls = s === 'expired' ? 'font-medium text-red-600 dark:text-red-400' : s === 'soon' ? 'font-medium text-amber-700 dark:text-amber-400' : ui.muted;
  return (
    <div className="whitespace-nowrap">
      <div className="text-sm">{formatDate(c.expiryDate)}</div>
      <div className={`text-xs ${subCls}`}>{sub}</div>
    </div>
  );
}

function HazardDiamond({ code }: { code: string }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center">
      <span className="grid h-[17px] w-[17px] rotate-45 place-items-center border-2 border-red-600 bg-white">
        <span className="-rotate-45 text-[8px] font-bold leading-none text-gray-900">{code.slice(-2)}</span>
      </span>
    </span>
  );
}

function HazardPills({ hazards, max = 3 }: { hazards: Hazard[]; max?: number }) {
  if (!hazards.length) return <span className={`text-sm ${ui.muted}`}>—</span>;
  const extra = hazards.length - max;
  return (
    <div className="flex items-center" title={hazards.map((h) => `${h.code} ${h.name}`).join(', ')}>
      {hazards.slice(0, max).map((h) => (
        <HazardDiamond key={h.hazardId} code={h.code} />
      ))}
      {extra > 0 && <span className={`ml-1 text-xs ${ui.muted}`}>+{extra}</span>}
    </div>
  );
}

function Thumb({
  src,
  alt,
  size = 'sm',
  onClick,
  previewSrc,
}: {
  src: string | null;
  alt: string;
  size?: 'sm' | 'lg';
  onClick?: () => void;
  previewSrc?: string | null;
}) {
  const resolved = previewSrc ?? resolveImageUrl(src);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const box = size === 'lg' ? 'h-28 w-28 rounded-xl' : 'h-11 w-11 rounded-lg';

  if (!resolved || brokenSrc === resolved) {
    return (
      <div className={`${box} grid shrink-0 place-items-center bg-[#f1f3f4] ${ui.muted} dark:bg-[#2d2e30]`}>
        <Icon name="flask" className={size === 'lg' ? 'h-8 w-8' : 'h-5 w-5'} />
      </div>
    );
  }
  return (
    <button
      type="button"
      title="View image"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`${box} shrink-0 overflow-hidden bg-[#f1f3f4] ring-1 ring-[#dadce0] transition hover:ring-[#1558b0] dark:ring-[#3c4043] ${ui.focus}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolved} alt={alt} onError={() => setBrokenSrc(resolved)} className="h-full w-full object-cover" />
    </button>
  );
}

function PreviewNote() {
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${ui.border} ${ui.muted}`}>
      <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
      Not connected to the backend yet.
    </div>
  );
}

/* ============================================================================
   Overlays
   ========================================================================== */

function useOverlay(onClose: () => void, capture = false) {
  const ref = useRef(onClose);
  useEffect(() => {
    ref.current = onClose;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (capture) e.stopPropagation(); // top-most overlay closes first
      ref.current();
    };
    window.addEventListener('keydown', onKey, capture);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, capture);
      document.body.style.overflow = prev;
    };
  }, [capture]);
}

function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useOverlay(onClose, true);
  const width = size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-2xl';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative flex max-h-[94vh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-[#1e1f20] sm:rounded-2xl ${width}`}>
        <div className={`flex items-start justify-between gap-4 border-b px-6 py-4 ${ui.border}`}>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className={`mt-0.5 text-sm ${ui.muted}`}>{description}</p>}
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className={`flex justify-end gap-2 rounded-b-2xl border-t px-6 py-3 ${ui.border}`}>{footer}</div>}
      </div>
    </div>
  );
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useOverlay(onClose, true);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <Icon name="x" className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} className="max-h-[80vh] max-w-full rounded-lg bg-white object-contain shadow-2xl" />
      <p className="mt-4 text-sm text-white/80">{alt}</p>
    </div>
  );
}

/* ============================================================================
   Add / Edit form (popup)
   ========================================================================== */

type FormState = {
  name: string;
  description: string;
  unit: string;
  currentStock: string;
  reorderThreshold: string;
  phValue: string;
  expiryDate: string;
  imageUrl: string;
};
type FormErrors = Partial<Record<keyof FormState, string>> & { photo?: string };

function toForm(c?: Consumable): FormState {
  return {
    name: c?.name ?? '',
    description: c?.description ?? '',
    unit: c?.unit ?? '',
    currentStock: c ? String(c.currentStock) : '',
    reorderThreshold: c ? String(c.reorderThreshold) : '',
    phValue: c?.phValue != null ? String(c.phValue) : '',
    expiryDate: c?.expiryDate ?? '',
    imageUrl: c?.imageUrl ?? '',
  };
}

function validate(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = 'Name is required.';
  else if (f.name.length > 150) e.name = 'Max 150 characters.';
  if (f.description.length > 250) e.description = 'Max 250 characters.';
  if (!f.unit) e.unit = 'Select a unit.';
  if (f.currentStock === '') e.currentStock = 'Required.';
  else if (Number(f.currentStock) < 0) e.currentStock = 'Must be 0 or more.';
  if (f.reorderThreshold === '') e.reorderThreshold = 'Required.';
  else if (Number(f.reorderThreshold) < 0) e.reorderThreshold = 'Must be 0 or more.';
  if (f.phValue !== '') {
    const ph = Number(f.phValue);
    if (Number.isNaN(ph) || ph < 0 || ph > 14) e.phValue = 'pH must be between 0 and 14.';
  }
  if (f.imageUrl.length > 500) e.imageUrl = 'URL max 500 characters.';
  return e;
}

function Field({
  label,
  required,
  hint,
  help,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className={`mb-3 border-b pb-2 ${ui.border}`}>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ConsumableFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Consumable;
  onClose: () => void;
  onSave: (data: SavePayload, photoFile: File | null, removePhoto: boolean) => Promise<void>;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const photoInput = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep a legacy unit (e.g. "bottle") selectable so editing doesn't silently drop it.
  const unitOptions: string[] = initial && !UNITS.includes(initial.unit as (typeof UNITS)[number]) ? [...UNITS, initial.unit] : [...UNITS];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.values(errs).some(Boolean) || errors.photo) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim() || null,
        unit: form.unit,
        currentStock: Number(form.currentStock),
        reorderThreshold: Number(form.reorderThreshold),
        phValue: form.phValue === '' ? null : Number(form.phValue),
        expiryDate: form.expiryDate || null,
        imageUrl: photoFile ? null : form.imageUrl.trim() || null,
      }, photoFile, removePhoto);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    const error = validatePhoto(file);
    setErrors((current) => ({ ...current, photo: error ?? undefined }));
    if (error) return;
    setPhotoFile(file);
    setRemovePhoto(false);
    setForm((current) => ({ ...current, imageUrl: '' }));
    readAsDataUrl(file)
      .then(setPhotoPreview)
      .catch(() => setErrors((current) => ({ ...current, photo: 'The image preview could not be loaded.' })));
  }

  function keepCurrentPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(false);
    setForm((current) => ({ ...current, imageUrl: initial?.imageUrl ?? '' }));
    setErrors((current) => ({ ...current, photo: undefined }));
  }

  const hasSavedPhoto = Boolean(initial?.imageUrl && !removePhoto);
  const hasAnyPhoto = Boolean(photoFile || hasSavedPhoto);

  return (
    <Modal
      size="lg"
      title={isEdit ? 'Edit consumable' : 'Add consumable'}
      description={isEdit ? `Update details for ${initial!.name}.` : 'Add a new chemical or supply to the inventory.'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="consumable-form" className={btn.primary} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add consumable'}
          </button>
        </>
      }
    >
      <form id="consumable-form" onSubmit={submit} noValidate className="space-y-7">
        {saveError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <Icon name="alert" className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <div>
            <span className={labelCls}>Image</span>
            <div className="mt-1.5">
              <Thumb
                src={removePhoto ? null : form.imageUrl.trim() || null}
                previewSrc={photoPreview}
                alt={form.name || 'Preview'}
                size="lg"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={btn.secondary} onClick={() => photoInput.current?.click()}>
                {hasAnyPhoto ? 'Change image' : 'Add image'}
              </button>
              {photoFile ? (
                <button type="button" className={ui.btnText} onClick={keepCurrentPhoto}>
                  {isEdit && initial?.imageUrl ? 'Keep current image' : 'Remove'}
                </button>
              ) : hasSavedPhoto ? (
                <button
                  type="button"
                  className={ui.btnDanger}
                  onClick={() => {
                    setRemovePhoto(true);
                    setForm((current) => ({ ...current, imageUrl: '' }));
                  }}
                >
                  Remove image
                </button>
              ) : removePhoto ? (
                <button type="button" className={ui.btnText} onClick={keepCurrentPhoto}>
                  Keep current image
                </button>
              ) : null}
            </div>
            <p className={`mt-1.5 text-xs ${ui.muted}`}>
              {removePhoto ? 'The image will be removed when you save.' : `JPG, PNG or WEBP, up to ${PHOTO_MAX_MB} MB`}
            </p>
            {errors.photo && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.photo}</p>}
            <input
              ref={photoInput}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                pickPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div className="relative mt-3">
              <span className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${ui.muted}`}>
                <Icon name="link" className="h-3.5 w-3.5" />
              </span>
              <input
                type="url"
                placeholder="Or paste image URL"
                value={form.imageUrl}
                onChange={(e) => {
                  set('imageUrl', e.target.value);
                  setRemovePhoto(false);
                }}
                className={`${inputClass(Boolean(errors.imageUrl))} !py-1.5 !pl-8 !text-xs`}
              />
            </div>
            {errors.imageUrl && <p className={`mt-1 text-xs ${ui.errorText}`}>{errors.imageUrl}</p>}
          </div>

          <div className="space-y-4">
            <Field label="Name" required error={errors.name}>
              <input
                autoFocus
                value={form.name}
                maxLength={150}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Hydrochloric Acid"
                className={inputClass(Boolean(errors.name))}
              />
            </Field>
            <Field label="Description" hint={`${form.description.length}/250`} error={errors.description}>
              <textarea
                rows={5}
                value={form.description}
                maxLength={250}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Grade, concentration, supplier notes…"
                className={`${inputClass(Boolean(errors.description))} resize-none`}
              />
            </Field>
          </div>
        </div>

        <Section title="Stock">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Unit" required error={errors.unit}>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className={inputClass(Boolean(errors.unit))}>
                <option value="">Select unit…</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {unitLabel(u)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Current stock" required error={errors.currentStock}>
              <span className="relative block">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={form.currentStock}
                  onChange={(e) => set('currentStock', e.target.value)}
                  placeholder="0"
                  className={`${inputClass(Boolean(errors.currentStock))} !pr-14`}
                />
                <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm ${ui.muted}`}>{form.unit}</span>
              </span>
            </Field>
            <Field label="Reorder threshold" required error={errors.reorderThreshold} help="Flag as low stock at or below this.">
              <span className="relative block">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={form.reorderThreshold}
                  onChange={(e) => set('reorderThreshold', e.target.value)}
                  placeholder="0"
                  className={`${inputClass(Boolean(errors.reorderThreshold))} !pr-14`}
                />
                <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm ${ui.muted}`}>{form.unit}</span>
              </span>
            </Field>
          </div>
        </Section>

        <Section title="Chemical details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="pH value" error={errors.phValue} help="Optional · 0.00 – 14.00">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={14}
                step="0.01"
                value={form.phValue}
                onChange={(e) => set('phValue', e.target.value)}
                placeholder="e.g. 7.00"
                className={inputClass(Boolean(errors.phValue))}
              />
            </Field>
            <Field label="Expiry date" help="Leave empty if it does not expire.">
              <input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className={inputClass()} />
            </Field>
          </div>
        </Section>
      </form>
    </Modal>
  );
}

/* ============================================================================
   Detail drawer
   ========================================================================== */

type DetailTab = 'overview' | 'hazards' | 'properties' | 'usage' | 'orders';

function DetailDrawer({
  item,
  canManage,
  onClose,
  onEdit,
  onDelete,
  onPreviewImage,
}: {
  item: Consumable;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreviewImage: () => void;
}) {
  useOverlay(onClose);
  const [tab, setTab] = useState<DetailTab>('overview');
  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'hazards', label: 'Hazards' },
    { id: 'properties', label: 'Properties' },
    { id: 'usage', label: 'Usage' },
    { id: 'orders', label: 'Orders' },
  ];

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-[#1e1f20]">
        <div className={`flex items-center justify-between gap-4 border-b px-6 py-4 ${ui.border}`}>
          <div className="min-w-0">
            <p className={`text-xs ${ui.muted}`}>Consumable #{item.consumableId}</p>
            <h2 className="truncate text-lg font-semibold">{item.name}</h2>
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-5 px-6 py-5">
            <Thumb src={item.imageUrl} alt={item.name} size="lg" onClick={onPreviewImage} />
            <div className="min-w-0 flex-1 space-y-3">
              <p className={`text-sm ${ui.muted}`}>{item.description ?? <span className="italic">No description</span>}</p>
              <div className="flex flex-wrap gap-1.5">
                <StockBadge c={item} />
                <ExpiryBadge c={item} />
              </div>
            </div>
          </div>

          <nav className={`flex gap-6 overflow-x-auto border-b px-6 ${ui.border}`} aria-label="Tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm transition ${
                  tab === t.id
                    ? 'border-[#1558b0] font-medium text-[#1558b0] dark:border-[#a8c7fa] dark:text-[#a8c7fa]'
                    : `border-transparent ${ui.muted} hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3]`
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="px-6 py-5">
            {tab === 'overview' ? (
              <div className="space-y-6">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <DetailItem label="Current stock" value={`${fmtNum(item.currentStock)} ${item.unit}`} />
                  <DetailItem label="Reorder threshold" value={`${fmtNum(item.reorderThreshold)} ${item.unit}`} />
                  <DetailItem label="Unit" value={unitLabel(item.unit)} />
                  <DetailItem label="pH value" value={item.phValue != null ? item.phValue.toFixed(2) : '—'} />
                  <DetailItem label="Expiry date" value={formatDate(item.expiryDate)} />
                </dl>
                <div>
                  <p className={`mb-2 text-xs font-medium ${ui.muted}`}>Stock level</p>
                  <StockCell c={item} />
                </div>
              </div>
            ) : (
              <>
                <PreviewNote />
                <p className={`py-6 text-center text-sm ${ui.muted}`}>Nothing to show yet.</p>
              </>
            )}
          </div>
        </div>

        {canManage && (
          <div className={`flex items-center justify-between border-t px-6 py-3 ${ui.border}`}>
            <button type="button" className={btn.dangerText} onClick={onDelete}>
              <Icon name="trash" /> <span className="ml-1.5">Delete</span>
            </button>
            <button type="button" className={btn.primary} onClick={onEdit}>
              <Icon name="pencil" /> <span className="ml-1.5">Edit</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className={`text-xs ${ui.muted}`}>{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

/* ============================================================================
   Grid card + stat card
   ========================================================================== */

function ConsumableCard({
  c,
  canManage,
  onOpen,
  onEdit,
  onDelete,
  onImage,
}: {
  c: Consumable;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImage: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const src = resolveImageUrl(c.imageUrl);
  return (
    <div className={`flex flex-col overflow-hidden ${ui.card}`}>
      <div className="relative aspect-[4/3] bg-[#f1f3f4] dark:bg-[#2d2e30]">
        {src && !broken ? (
          <button type="button" onClick={onImage} className="h-full w-full" title="View image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={c.name} onError={() => setBroken(true)} className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className={`grid h-full place-items-center ${ui.muted}`}>
            <Icon name="flask" className="h-12 w-12" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          <StockBadge c={c} />
          <ExpiryBadge c={c} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="font-medium hover:underline">{c.name}</h3>
          <p className={`mt-0.5 line-clamp-1 text-sm ${ui.muted}`}>{c.description ?? 'No description'}</p>
        </button>
        <div className="mt-4">
          <StockCell c={c} />
        </div>
        <div className={`mt-auto flex items-end justify-between gap-2 border-t pt-3 ${ui.border}`}>
          <ExpiryCell c={c} />
          <HazardPills hazards={c.hazards} />
        </div>
      </div>
      <div className={`flex divide-x border-t text-sm ${ui.border} divide-[#dadce0] dark:divide-[#3c4043]`}>
        <button type="button" onClick={onOpen} className={`flex-1 py-2 ${ui.hover}`}>View</button>
        {canManage && (
          <>
            <button type="button" onClick={onEdit} className={`flex-1 py-2 ${ui.hover}`}>Edit</button>
            <button type="button" onClick={onDelete} className={`flex-1 py-2 ${ui.errorText} hover:bg-[#b3261e]/5`}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: IconName;
  tone: 'gray' | 'amber' | 'red';
  active: boolean;
  onClick: () => void;
}) {
  const toneCls = {
    gray: 'bg-[#f1f3f4] text-[#5f6368] dark:bg-[#2d2e30] dark:text-[#9aa0a6]',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-4 p-4 text-left transition ${ui.card} ${ui.focus} ${
        active ? 'ring-2 ring-[#1558b0] dark:ring-[#a8c7fa]' : ''
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${toneCls}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-2xl font-semibold tabular-nums">{value}</span>
        <span className={`block text-xs ${ui.muted}`}>{label}</span>
      </span>
    </button>
  );
}

/* ============================================================================
   Page
   ========================================================================== */

type StatusFilter = 'all' | 'low' | 'soon' | 'expired';
type SortKey = 'name' | 'stock' | 'expiry';

export default function ConsumablesPage() {
  const { user } = useCurrentUser();
  const canManage = user?.role === 'lab_manager' || user?.role === 'lecturer';

  const [items, setItems] = useState<Consumable[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [view, setView] = useState<'table' | 'grid'>('table');

  const [formTarget, setFormTarget] = useState<{ item?: Consumable } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Consumable | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ApiConsumable[]>('/api/consumables')
      .then((rows) => {
        if (cancelled) return;
        setItems(rows.map(fromApi));
        setListError(null);
      })
      .catch((err) => {
        if (!cancelled) setListError(err instanceof Error ? err.message : 'Could not load consumables');
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const detailItem = items.find((c) => c.consumableId === detailId) ?? null;

  const unitsInUse = useMemo(() => {
    const extra = items.map((c) => c.unit).filter((u) => !UNITS.includes(u as (typeof UNITS)[number]));
    return [...UNITS, ...new Set(extra)];
  }, [items]);

  const stats = useMemo(
    () => ({
      total: items.length,
      low: items.filter((c) => stockStatus(c) !== 'in').length,
      soon: items.filter((c) => expiryStatus(c) === 'soon').length,
      expired: items.filter((c) => expiryStatus(c) === 'expired').length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((c) => {
      if (q && !`${c.name} ${c.description ?? ''}`.toLowerCase().includes(q)) return false;
      if (unitFilter !== 'all' && c.unit !== unitFilter) return false;
      if (statusFilter === 'low' && stockStatus(c) === 'in') return false;
      if (statusFilter === 'soon' && expiryStatus(c) !== 'soon') return false;
      if (statusFilter === 'expired' && expiryStatus(c) !== 'expired') return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'stock') return a.currentStock / (a.reorderThreshold || 1) - b.currentStock / (b.reorderThreshold || 1);
      if (sort === 'expiry') return (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31');
      return a.name.localeCompare(b.name);
    });
  }, [items, query, unitFilter, statusFilter, sort]);

  const filtersActive = query !== '' || unitFilter !== 'all' || statusFilter !== 'all';

  function clearFilters() {
    setQuery('');
    setUnitFilter('all');
    setStatusFilter('all');
  }

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }

  // Throws on failure so the form can show the backend's message.
  async function handleSave(data: SavePayload, photoFile: File | null, removePhoto: boolean) {
    const editing = formTarget?.item;
    let saved: Consumable;
    if (editing) {
      saved = await apiFetch<Consumable>(`/api/consumables/${editing.consumableId}`, { method: 'PUT', json: data });
    } else {
      saved = await apiFetch<Consumable>('/api/consumables', { method: 'POST', json: data });
    }

    let notice = editing ? `Saved changes to ${data.name}` : `${data.name} added`;
    try {
      if (photoFile) {
        await apiFetch<Consumable>(`/api/consumables/${saved.consumableId}/image`, {
          method: 'PUT',
          headers: { 'Content-Type': photoFile.type },
          body: photoFile,
        });
      } else if (removePhoto && !data.imageUrl && editing?.imageUrl) {
        await apiFetch<Consumable>(`/api/consumables/${saved.consumableId}/image`, { method: 'DELETE' });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      notice = `${notice}, but the image could not be updated (${reason}). Open Edit to try again.`;
    }

    showToast(notice);
    setFormTarget(null);
    reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/consumables/${deleteTarget.consumableId}`, { method: 'DELETE' });
      showToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  function openImage(c: Consumable) {
    const src = resolveImageUrl(c.imageUrl);
    if (src) setLightbox({ src, alt: c.name });
  }
  const toggleStatus = (s: StatusFilter) => setStatusFilter((cur) => (cur === s ? 'all' : s));

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-sm font-medium ${ui.muted}`}>Inventory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Consumables</h1>
          <p className={`mt-1 text-sm ${ui.muted}`}>Chemicals and supplies — stock levels, expiry dates and hazards.</p>
        </div>
        {canManage && (
          <button type="button" className={btn.primary} onClick={() => setFormTarget({})}>
            <Icon name="plus" /> <span className="ml-1.5">Add consumable</span>
          </button>
        )}
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total items" value={stats.total} icon="package" tone="gray" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <StatCard label="Low / out of stock" value={stats.low} icon="alert" tone="amber" active={statusFilter === 'low'} onClick={() => toggleStatus('low')} />
        <StatCard label={`Expiring ≤ ${EXPIRY_SOON_DAYS} days`} value={stats.soon} icon="clock" tone="amber" active={statusFilter === 'soon'} onClick={() => toggleStatus('soon')} />
        <StatCard label="Expired" value={stats.expired} icon="ban" tone="red" active={statusFilter === 'expired'} onClick={() => toggleStatus('expired')} />
      </div>

      <div className={`mt-6 overflow-hidden ${ui.card}`}>
        <div className={`flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between ${ui.border}`}>
          <div className="relative w-full lg:max-w-sm">
            <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${ui.muted}`}>
              <Icon name="search" />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or description…"
              className={`${inputClass()} !pl-9`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter by unit" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className={selectCls}>
              <option value="all">All units</option>
              {unitsInUse.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectCls}>
              <option value="all">All statuses</option>
              <option value="low">Low / out of stock</option>
              <option value="soon">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
            <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
              <option value="name">Sort: Name</option>
              <option value="stock">Sort: Stock level</option>
              <option value="expiry">Sort: Expiry date</option>
            </select>
            <div className={`inline-flex rounded-full border p-0.5 ${ui.border}`} role="group" aria-label="View">
              {(['table', 'grid'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  title={v === 'table' ? 'Table view' : 'Grid view'}
                  onClick={() => setView(v)}
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${
                    view === v ? 'bg-[#1558b0] text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]' : `${ui.muted} ${ui.hover}`
                  }`}
                >
                  <Icon name={v === 'table' ? 'list' : 'grid'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {listLoading ? (
          <p className={`px-6 py-16 text-center text-sm ${ui.muted}`}>Loading consumables…</p>
        ) : listError ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <p className={`text-sm ${ui.errorText}`}>{listError}</p>
            <button type="button" className={`${btn.secondary} mt-4`} onClick={reload}>
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className={`grid h-12 w-12 place-items-center rounded-full bg-[#f1f3f4] dark:bg-[#2d2e30] ${ui.muted}`}>
              <Icon name="flask" className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">{items.length === 0 ? 'No consumables yet' : 'No consumables match your filters'}</h3>
            <p className={`mt-1 text-sm ${ui.muted}`}>
              {items.length === 0 ? 'Add your first chemical or supply to get started.' : 'Try a different search term or clear the filters.'}
            </p>
            <div className="mt-5">
              {items.length === 0 ? (
                canManage && (
                  <button type="button" className={btn.primary} onClick={() => setFormTarget({})}>
                    <Icon name="plus" /> <span className="ml-1.5">Add consumable</span>
                  </button>
                )
              ) : (
                <button type="button" className={btn.secondary} onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={headCellBg}>
                <tr>
                  {['Consumable', 'Stock', 'pH', 'Expiry', 'Hazards', 'Status'].map((h) => (
                    <th key={h} scope="col" className={`whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide first:pl-6 ${ui.muted}`}>
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.consumableId} onClick={() => setDetailId(c.consumableId)} className={`cursor-pointer border-t transition ${ui.border} ${ui.hover}`}>
                    <td className="py-3 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <Thumb src={c.imageUrl} alt={c.name} onClick={() => openImage(c)} />
                        <div className="min-w-0">
                          <div className="font-medium">{c.name}</div>
                          <div className={`max-w-[260px] truncate text-xs ${ui.muted}`}>{c.description ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StockCell c={c} /></td>
                    <td className="px-4 py-3 tabular-nums">{c.phValue != null ? c.phValue.toFixed(2) : <span className={ui.muted}>—</span>}</td>
                    <td className="px-4 py-3"><ExpiryCell c={c} /></td>
                    <td className="px-4 py-3"><HazardPills hazards={c.hazards} /></td>
                    <td className="px-4 py-3"><StockBadge c={c} /></td>
                    <td className="py-3 pl-4 pr-6">
                      <div className="flex justify-end gap-0.5">
                        <IconButton icon="eye" label="View details" onClick={() => setDetailId(c.consumableId)} />
                        {canManage && (
                          <>
                            <IconButton icon="pencil" label="Edit" onClick={() => setFormTarget({ item: c })} />
                            <IconButton icon="trash" label="Delete" danger onClick={() => setDeleteTarget(c)} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((c) => (
              <ConsumableCard
                key={c.consumableId}
                c={c}
                canManage={canManage}
                onOpen={() => setDetailId(c.consumableId)}
                onEdit={() => setFormTarget({ item: c })}
                onDelete={() => setDeleteTarget(c)}
                onImage={() => openImage(c)}
              />
            ))}
          </div>
        )}

        {!listLoading && !listError && visible.length > 0 && (
          <div className={`flex items-center justify-between border-t px-6 py-3 text-xs ${ui.border} ${ui.muted}`}>
            <span>
              Showing <span className="font-medium">{visible.length}</span> of {items.length} consumables
            </span>
            {filtersActive && (
              <button type="button" className="font-medium hover:underline" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {detailItem && (
        <DetailDrawer
          item={detailItem}
          canManage={canManage}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setFormTarget({ item: detailItem });
          }}
          onDelete={() => {
            setDetailId(null);
            setDeleteTarget(detailItem);
          }}
          onPreviewImage={() => openImage(detailItem)}
        />
      )}

      {formTarget && (
        <ConsumableFormModal
          key={formTarget.item?.consumableId ?? 'new'}
          initial={formTarget.item}
          onClose={() => setFormTarget(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <Modal
          size="sm"
          title="Delete consumable?"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button type="button" className={btn.secondary} onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className={btn.danger} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          }
        >
          <div className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <Icon name="alert" className="h-5 w-5" />
            </span>
            <p className={`text-sm ${ui.muted}`}>
              <span className="font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">{deleteTarget.name}</span> will be permanently removed from the inventory.
              This can&apos;t be undone.
            </p>
          </div>
        </Modal>
      )}

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {toast && (
        <div role="status" className="fixed bottom-4 right-4 z-[70] rounded-lg bg-[#1f1f1f] px-4 py-3 text-sm text-white shadow-lg dark:bg-[#e3e3e3] dark:text-[#1f1f1f]">
          {toast}
        </div>
      )}
    </div>
  );
}
