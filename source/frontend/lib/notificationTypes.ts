// lib/notificationTypes.ts — the shape of a notification and the fixed values of the bell.
// The data comes from /api/notifications (backend/routes/notificationRoutes.js).

export type NotifType = 'status_change' | 'approval_needed' | 'new_comment' | 'reminder' | 'low_stock';

export type NotificationRow = {
  notificationId: number;
  requestId: number | null;
  labSessionId: number | null;
  consumableId: number | null;
  message: string;
  notifType: NotifType | null;
  isRead: boolean;
  createdAt: string;
  request: { requestId: number; title: string; status: string } | null;
  session: { labSessionId: number; name: string; status: string } | null;
  consumable: { consumableId: number; name: string } | null;
};

/** One page of the list; nextCursor is the id to pass as ?before= for the next page (null = no more). */
export type NotificationListResponse = {
  items: NotificationRow[];
  nextCursor: number | null;
};

export const NOTIFICATION_PAGE_SIZE = 15;
/** How often the unread number is refreshed while the tab is visible. */
export const NOTIFICATION_POLL_MS = 30_000;

export const TYPE_LABELS: Record<NotifType, string> = {
  status_change: 'Update',
  approval_needed: 'Needs approval',
  new_comment: 'New comment',
  reminder: 'Reminder',
  low_stock: 'Low stock',
};