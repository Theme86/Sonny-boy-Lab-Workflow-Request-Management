// frontend/lib/requestActions.ts
// What lab staff can do to a request from its detail page: who sees the controls, when the assignee is locked,
// and how the buttons are worded. Mirrors backend/utils/requestStatus.js and the checks in
// PATCH /api/requests/:id/status and /assignee. The backend stays the judge; this only decides what to show.
import { ROLE_NAMES, STATUS_LABELS, fullName } from '@/lib/requests';

/** Same list as STAFF_ROLES in backend/utils/requestStatus.js. */
export const STAFF_ROLES = ['ta', 'lecturer', 'lab_manager'];
export const isStaffRole = (role?: string) => !!role && STAFF_ROLES.includes(role);

/** Button text for moving a request to `status`. */
export const statusActionLabel = (status: string) =>
  status === 'closed' ? 'Close request' : `Move to ${STATUS_LABELS[status] ?? status}`;

/** Closing is final (nothing can follow "closed"), so the page asks before doing it. */
export const needsConfirm = (status: string) => status === 'closed';

/** Why the assignee can't be changed right now, or null when it can. Same rules as PATCH /:id/assignee. */
export function assignBlockedReason(
  request: { status: string; industryDetail: { confidentiality: string } | null },
  role?: string,
): string | null {
  if (request.status === 'closed') return 'A closed request cannot be reassigned.';
  if (request.industryDetail?.confidentiality === 'restricted' && role !== 'lab_manager') {
    return 'Only the Lab Manager can assign a restricted request.';
  }
  return null;
}

/** Dropdown text for someone a request can be assigned to, e.g. "Tara Tan (TA)". */
export const assigneeLabel = (person: { firstName: string; lastName: string; role: string }) =>
  `${fullName(person)} (${ROLE_NAMES[person.role] ?? person.role})`;
