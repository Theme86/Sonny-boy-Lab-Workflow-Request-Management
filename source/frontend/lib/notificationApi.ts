// lib/notificationApi.ts — the requests the bell sends to /api/notifications.
import { apiFetch, ApiError } from './api';
import { NOTIFICATION_PAGE_SIZE, type NotificationListResponse } from './notificationTypes';

/** The text shown when loading fails: the server's message when there is one. */
export const loadErrorMessage = (err: unknown) => (err instanceof ApiError ? err.message : 'Could not load notifications.');

/** One page, newest first; pass the previous page's nextCursor as `before` for the next one. */
export const fetchNotificationPage = (before?: number) =>
  apiFetch<NotificationListResponse>(`/api/notifications?limit=${NOTIFICATION_PAGE_SIZE}${before === undefined ? '' : `&before=${before}`}`);

export const fetchUnreadCount = () => apiFetch<{ count: number }>('/api/notifications/unread-count');

export const saveRead = (id: number) => apiFetch(`/api/notifications/${id}`, { method: 'PATCH', json: { isRead: true } });

export const saveAllRead = () => apiFetch('/api/notifications/read-all', { method: 'POST' });