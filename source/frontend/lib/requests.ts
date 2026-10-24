// frontend/lib/requests.ts
// Shared types, labels and client-side validation for the Request feature.
// Limits/enum values mirror backend/utils/validateRequest.js and prisma/schema.prisma.
// (Which status can follow which lives in the backend: it sends `allowedStatuses`.)

export const LIMITS = { titleMin: 3, titleMax: 150, descMin: 5, descMax: 250 };

// Types this form can submit (consumable / equipment requests have their own forms)
export const FORM_TYPES = [
  { value: 'ticket', label: 'General ticket (e.g. script fix)' },
  { value: 'maintenance', label: 'Equipment issue or maintenance' },
  { value: 'access_permission', label: 'Access permission' },
] as const;

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const PRIORITY_LABELS: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
export const RESOURCE_TYPES = ['room', 'equipment', 'software'] as const;
export const RESOURCE_LABELS: Record<string, string> = { room: 'Room', equipment: 'Equipment', software: 'Software' };

export const TYPE_LABELS: Record<string, string> = {
  ticket: 'Ticket',
  maintenance: 'Maintenance',
  access_permission: 'Access permission',
  consumable_order: 'Consumable order',
  equipment_reservation: 'Equipment reservation',
};

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_review: 'In review',
  approved: 'Approved',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
  rejected: 'Rejected',
  closed: 'Closed',
};

export const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-200',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/20 dark:text-indigo-200',
  blocked: 'bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-200',
  closed: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-400/20 dark:text-zinc-300',
};

export const ROLE_NAMES: Record<string, string> = { ta: 'TA', lecturer: 'Lecturer', lab_manager: 'Lab manager', member: 'Member' };

export type PersonRef = { userId: number; firstName: string; lastName: string; email: string };
export type Assignee = { userId: number; firstName: string; lastName: string; role: string };

export type RequestItem = {
  requestId: number;
  requesterId: number;
  assignedTo: number | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  equipmentId: number | null;
  createdAt: string;
  updatedAt: string | null;
  closedAt: string | null;
  requester: PersonRef;
  assignee: PersonRef | null;
  equipment: { equipmentId: number; name: string } | null;
};

export type RequestDetail = RequestItem & {
  accessDetail: { resourceType: string; resourceId: number | null; expiresAt: string | null } | null;
  consumableOrderItems: {
    orderItemId: number;
    quantityRequested: string;
    consumable: { name: string; unit: string };
  }[];
  statusHistory: {
    historyId: number;
    oldStatus: string | null;
    newStatus: string | null;
    changedAt: string;
    changer: PersonRef | null;
  }[];
};

export type RequestListResponse = { items: RequestItem[]; total: number; page: number; limit: number };
/** Sent by GET /:id and by the status/assignee updates. allowedStatuses = what this person may pick now. */
export type RequestDetailResponse = { request: RequestDetail; allowedStatuses: string[] };

// ---- submit form ----
export type FormValues = {
  type: string;
  title: string;
  description: string;
  priority: string;
  equipmentId: string;
  resourceType: string;
  resourceId: string;
  expiresAt: string;
};
export type FormErrors = Partial<Record<keyof FormValues, string>>;

export const emptyForm: FormValues = {
  type: 'ticket',
  title: '',
  description: '',
  priority: 'medium',
  equipmentId: '',
  resourceType: '',
  resourceId: '',
  expiresAt: '',
};

const isPositiveInt = (v: string) => /^\d+$/.test(v) && Number(v) > 0;

export function validateForm(v: FormValues): FormErrors {
  const e: FormErrors = {};
  const title = v.title.trim();
  const description = v.description.trim();

  if (!title) e.title = 'Enter a title.';
  else if (title.length < LIMITS.titleMin) e.title = `Use at least ${LIMITS.titleMin} characters.`;
  else if (title.length > LIMITS.titleMax) e.title = `Use at most ${LIMITS.titleMax} characters.`;

  if (!description) e.description = 'Describe what you need or what went wrong.';
  else if (description.length < LIMITS.descMin) e.description = `Use at least ${LIMITS.descMin} characters.`;
  else if (description.length > LIMITS.descMax) e.description = `Use at most ${LIMITS.descMax} characters.`;

  if (v.type === 'maintenance' && v.equipmentId.trim() && !isPositiveInt(v.equipmentId.trim())) {
    e.equipmentId = 'Use a whole number, e.g. 12.';
  }

  if (v.type === 'access_permission') {
    if (!v.resourceType) e.resourceType = 'Choose what you need access to.';
    if (v.resourceId.trim() && !isPositiveInt(v.resourceId.trim())) {
      e.resourceId = 'Use a whole number, e.g. 3.';
    }
    if (v.expiresAt && new Date(v.expiresAt) <= new Date()) e.expiresAt = 'Pick a date in the future.';
  }
  return e;
}

// Build the JSON body the API expects (only send fields relevant to the chosen type)
export function toPayload(v: FormValues) {
  const base = {
    type: v.type,
    title: v.title.trim(),
    description: v.description.trim(),
    priority: v.priority,
  };
  if (v.type === 'maintenance') {
    return { ...base, equipmentId: v.equipmentId.trim() || undefined };
  }
  if (v.type === 'access_permission') {
    return {
      ...base,
      resourceType: v.resourceType,
      resourceId: v.resourceId.trim() || undefined,
      expiresAt: v.expiresAt || undefined,
    };
  }
  return base;
}

export const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
export const formatDate = (iso: string) => new Date(iso).toLocaleString();
