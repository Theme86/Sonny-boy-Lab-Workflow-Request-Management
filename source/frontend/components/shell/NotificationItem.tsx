// components/shell/NotificationItem.tsx — one row of the pop-up: unread dot, message, type and age.
import { timeAgo, TYPE_LABELS, type NotificationRow } from '@/lib/notifications';
import { ui } from '@/lib/ui';

type Props = { n: NotificationRow; onOpen: (n: NotificationRow) => void };

export function NotificationItem({ n, onOpen }: Props) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(n)}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left ${ui.hover} ${ui.focus}`}
      >
        <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-vl-accent'}`} />
        <span className="min-w-0 flex-1">
          <span className={`block text-sm break-words ${n.isRead ? ui.muted : 'font-medium'}`}>
            {!n.isRead && <span className="sr-only">Unread: </span>}
            {n.message}
          </span>
          <span className={`mt-0.5 block text-xs ${ui.muted}`}>
            {n.notifType ? `${TYPE_LABELS[n.notifType]} · ` : ''}
            {timeAgo(n.createdAt)}
          </span>
        </span>
      </button>
    </li>
  );
}