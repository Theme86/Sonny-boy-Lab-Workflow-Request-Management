// components/dashboard/NotificationsPanel.tsx — your newest unread notifications.
import type { Dashboard } from '@/lib/dashboardTypes';
import { dayLabel, formatTime } from '@/lib/dashboardTime';
import { ui } from '@/lib/ui';
import { EmptyNote, Panel } from './Panel';

type NotificationSummary = Dashboard['me']['notifications'];

export function NotificationsPanel({ notifications, now = new Date() }: { notifications: NotificationSummary; now?: Date }) {
  return (
    <Panel label={notifications.unread > 0 ? `Unread · ${notifications.unread}` : 'Unread'}>
      {notifications.latest.length === 0 ? (
        <EmptyNote>You are all caught up.</EmptyNote>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.latest.map((n) => (
            <li key={n.notificationId} className="text-sm">
              <p>{n.message}</p>
              <p className={`mt-0.5 text-xs ${ui.muted}`}>
                {dayLabel(n.createdAt, now)} {formatTime(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
