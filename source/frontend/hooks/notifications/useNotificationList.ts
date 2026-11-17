// hooks/notifications/useNotificationList.ts — the list in the pop-up: first page, "Show older", and local read marks.
import { useCallback, useState } from 'react';
import { fetchNotificationPage, loadErrorMessage } from '@/lib/notificationApi';
import { withAllRead, withOneRead } from '@/lib/notificationReads';
import type { NotificationRow } from '@/lib/notifications';

export function useNotificationList() {
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await fetchNotificationPage();
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(loadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadMore() {
    if (nextCursor === null || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const page = await fetchNotificationPage(nextCursor);
      setItems((list) => [...(list ?? []), ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(loadErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }

  const markRead = (id: number) => setItems((list) => withOneRead(list, id));
  const markAllShownRead = () => setItems(withAllRead);

  return { items, loading, loadingMore, error, hasMore: nextCursor !== null, loadFirstPage, loadMore, markRead, markAllShownRead };
}