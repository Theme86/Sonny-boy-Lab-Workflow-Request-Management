// components/shell/NotificationPanel.tsx — the pop-up under the bell: newest notifications first.
// It only draws; NotificationBell loads the data and handles the clicks.
import type { NotificationRow } from '@/lib/notifications';
import { NotificationBody } from './NotificationBody';
import { NotificationFooter } from './NotificationFooter';
import { NotificationPanelHeader } from './NotificationPanelHeader';

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

export function NotificationPanel(p: Props) {
  const showFooter = p.items !== null && p.items.length > 0 && (p.hasMore || p.error);
  return (
    <div role="dialog" aria-label="Notifications" className={PANEL}>
      <NotificationPanelHeader unread={p.unread} onMarkAllRead={p.onMarkAllRead} />
      <div className="max-h-[min(28rem,65vh)] overflow-y-auto rounded-2xl bg-vl-surface">
        <NotificationBody items={p.items} loading={p.loading} error={p.error} onOpenItem={p.onOpenItem} onRetry={p.onRetry} />
        {showFooter && <NotificationFooter hasMore={p.hasMore} error={p.error} loadingMore={p.loadingMore} onLoadMore={p.onLoadMore} />}
      </div>
    </div>
  );
}