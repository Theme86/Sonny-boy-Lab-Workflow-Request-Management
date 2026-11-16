// lib/notificationReads.ts — marks notifications as read in the list shown on screen (before the server has saved it).
import type { NotificationRow } from './notificationTypes';

type List = NotificationRow[] | null;

export const withOneRead = (list: List, id: number): List =>
  list?.map((x) => (x.notificationId === id ? { ...x, isRead: true } : x)) ?? null;

export const withAllRead = (list: List): List => list?.map((x) => ({ ...x, isRead: true })) ?? null;