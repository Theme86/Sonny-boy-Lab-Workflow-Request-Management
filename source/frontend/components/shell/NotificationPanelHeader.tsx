// components/shell/NotificationPanelHeader.tsx — the title of the pop-up and the "Mark all as read" button.
import { ui } from '@/lib/ui';

type Props = { unread: number; onMarkAllRead: () => void };

export function NotificationPanelHeader({ unread, onMarkAllRead }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-3">
      <h2 className="text-base font-medium">Notifications</h2>
      <button
        type="button"
        onClick={onMarkAllRead}
        disabled={unread === 0}
        className={`rounded px-1 text-sm font-medium text-vl-accent hover:underline disabled:cursor-not-allowed disabled:text-vl-muted disabled:no-underline ${ui.focus}`}
      >
        Mark all as read
      </button>
    </div>
  );
}