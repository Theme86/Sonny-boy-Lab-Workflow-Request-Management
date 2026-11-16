// components/shell/NotificationBody.tsx — the middle of the pop-up: loading, error, empty, or the list.
import type { NotificationRow } from '@/lib/notifications';
import { NotificationItem } from './NotificationItem';
import { NotificationLoadError } from './NotificationLoadError';
import { NotificationNote } from './NotificationNote';

type Props = {
  items: NotificationRow[] | null;
  loading: boolean;
  error: string;
  onOpenItem: (n: NotificationRow) => void;
  onRetry: () => void;
};

export function NotificationBody({ items, loading, error, onOpenItem, onRetry }: Props) {
  if (loading && items === null) return <NotificationNote>Loading…</NotificationNote>;
  if (error && items === null) return <NotificationLoadError error={error} onRetry={onRetry} />;
  if (items !== null && items.length === 0) return <NotificationNote>You&apos;re all caught up.</NotificationNote>;
  return (
    <ul className="divide-y divide-vl-line">
      {items?.map((n) => (
        <NotificationItem key={n.notificationId} n={n} onOpen={onOpenItem} />
      ))}
    </ul>
  );
}