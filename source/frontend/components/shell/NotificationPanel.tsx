// components/shell/NotificationPanel.tsx — the pop-up under the bell: newest notifications first.
// It only draws; NotificationBell loads the data and handles the clicks.
import { timeAgo, TYPE_LABELS, type NotificationRow } from '@/lib/notifications';
import { ui } from '@/lib/ui';

// Phones: pinned under the top bar with a margin on both sides. From sm up: hangs under the bell, like the account panel.
const PANEL =
  'fixed inset-x-4 top-[4.5rem] z-30 rounded-3xl bg-vl-surface-2 p-2 text-vl-ink shadow-[0_4px_8px_3px_rgba(60,64,67,.15),0_1px_3px_rgba(60,64,67,.3)] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96';

type Props = {
  items: NotificationRow[] | null;
  loading: boolean;
  error: string;
  unread: number;
  hasMore: boolean;
  loadingMore: boolean;
  onOpenItem: (n: NotificationRow) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

export function NotificationPanel({
  items, loading, error, unread, hasMore, loadingMore, onOpenItem, onMarkAllRead, onLoadMore, onRetry,
}: Props) {
  return (
    <div role="dialog" aria-label="Notifications" className={PANEL}>
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

      <div className="max-h-[min(28rem,65vh)] overflow-y-auto rounded-2xl bg-vl-surface">
        {loading && items === null ? (
          <p className={`px-4 py-8 text-center text-sm ${ui.muted}`}>Loading…</p>
        ) : error && items === null ? (
          <div className="px-4 py-8 text-center text-sm">
            <p className={ui.errorText}>{error}</p>
            <button type="button" onClick={onRetry} className={`${ui.btnText} mt-2`}>
              Try again
            </button>
          </div>
        ) : items !== null && items.length === 0 ? (
          <p className={`px-4 py-8 text-center text-sm ${ui.muted}`}>You&apos;re all caught up.</p>
        ) : (
          <ul className={`divide-y ${'divide-vl-line'}`}>
            {items?.map((n) => (
              <li key={n.notificationId}>
                <button
                  type="button"
                  onClick={() => onOpenItem(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left ${ui.hover} ${ui.focus}`}
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-vl-accent'}`}
                  />
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
            ))}
          </ul>
        )}

        {items !== null && items.length > 0 && (hasMore || error) && (
          <div className={`border-t px-4 py-2 text-center ${ui.border}`}>
            {error && <p className={`mb-1 text-xs ${ui.errorText}`}>{error}</p>}
            {hasMore && (
              <button type="button" onClick={onLoadMore} disabled={loadingMore} className={ui.btnText}>
                {loadingMore ? 'Loading…' : 'Show older'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}