// components/dashboard/Notifications.tsx — the newest unread notifications as a timestamped log.
import { dayLabel, formatTime } from '@/lib/dashboardTime';
import type { Dashboard } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { EmptyLine, Section } from './Section';

type NotificationSummary = Dashboard['me']['notifications'];

export function Notifications({ notifications, now = new Date() }: { notifications: NotificationSummary; now?: Date }) {
  return (
    <Section title="Unread" count={notifications.unread || undefined} id="unread">
      {notifications.latest.length === 0 ? (
        <EmptyLine>No unread notifications.</EmptyLine>
      ) : (
        <ul className={dash.rows}>
          {notifications.latest.map((n) => (
            <li key={n.notificationId} className="px-4 py-2.5 text-sm">
              <span className={`block text-xs ${dash.muted} ${dash.num}`}>
                {dayLabel(n.createdAt, now)} {formatTime(n.createdAt)}
              </span>
              {n.message}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
