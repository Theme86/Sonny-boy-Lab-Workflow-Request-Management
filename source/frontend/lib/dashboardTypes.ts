// lib/dashboardTypes.ts — the shape of GET /api/dashboard (mirrors backend/services/dashboard).
import type { ConsumableItem, NotificationItem, PendingSession, QueuedRequest, RecentRequest, RoomStatus, UpcomingSession } from '@/lib/dashboardItems';
import type { Role } from '@/lib/users';

export type * from '@/lib/dashboardItems';

export type RequestStatus = 'open' | 'in_review' | 'approved' | 'in_progress' | 'blocked' | 'completed' | 'rejected' | 'closed';

export interface Limited<T> {
  total: number;
  items: T[];
}
export interface Attention {
  requests?: {
    unassigned: Limited<QueuedRequest>;
    blocked: number;
    assignedToMe: number;
    underMaintenance: { equipmentId: number; name: string }[];
  };
  pendingSessions?: Limited<PendingSession>;
  newMembers?: number;
}
export interface Dashboard {
  generatedAt: string;
  role: Role;
  me: {
    upcomingSessions: UpcomingSession[];
    requests: { counts: Record<RequestStatus, number>; active: number; recent: RecentRequest[] };
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
