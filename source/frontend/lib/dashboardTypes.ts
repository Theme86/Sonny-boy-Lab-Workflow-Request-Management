// lib/dashboardTypes.ts — the shape of GET /api/dashboard (mirrors backend/services/dashboard).
import type { Role } from '@/lib/users';

export type RequestStatus = 'open' | 'in_review' | 'approved' | 'in_progress' | 'blocked' | 'completed' | 'rejected' | 'closed';

export interface Limited<T> {
  total: number;
  items: T[];
}
export interface ConsumableItem {
  consumableId: number;
  name: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  expiryDate: string | null;
  daysLeft: number | null;
  expiry: 'expired' | 'soon' | null;
  hazards: string[];
}
export interface NextSession {
  labSessionId: number;
  name: string;
  status: string;
  start: string;
  end: string;
  room: { roomId: number; name: string };
}
export interface NotificationItem {
  notificationId: number;
  message: string;
  notifType: string;
  createdAt: string;
  requestId: number | null;
  labSessionId: number | null;
}
export interface BusyInterval {
  start: string;
  end: string;
}
export interface RoomStatus {
  roomId: number;
  name: string;
  busy: BusyInterval[];
  inUseNow: boolean;
}
export interface Attention {
  requests?: {
    unassigned: number;
    blocked: number;
    assignedToMe: number;
    underMaintenance: { equipmentId: number; name: string }[];
  };
  pendingSessions?: number;
  newMembers?: number;
}
export interface Dashboard {
  generatedAt: string;
  role: Role;
  me: {
    nextSession: NextSession | null;
    requests: { counts: Record<RequestStatus, number>; active: number };
    notifications: { unread: number; latest: NotificationItem[] };
  };
  lab: {
    consumables: { total: number; lowStock: Limited<ConsumableItem>; expiring: Limited<ConsumableItem> };
    equipment: { kinds: number; unitsAvailable: number; unitsTotal: number; allTaken: Limited<{ equipmentId: number; name: string }> };
    rooms: { from: string; to: string; rooms: RoomStatus[] };
  };
  attention: Attention | null;
}

export interface DayWindow {
  from: Date;
  to: Date;
}
