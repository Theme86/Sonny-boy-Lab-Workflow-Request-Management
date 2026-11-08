// components/shell/NotificationBell.tsx — the bell in the top bar, next to the account button.
// Shows the unread number (refreshed every 30 s), and opens a pop-up with the newest notifications.
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import {
  badgeText,
  NOTIFICATION_PAGE_SIZE,
  NOTIFICATION_POLL_MS,
  notificationHref,
  type NotificationListResponse,
  type NotificationRow,
} from '@/lib/notifications';
import { BellIcon } from './BellIcon';
import { barFocus } from './navStyles';
import { NotificationPanel } from './NotificationPanel';
import { useDismiss } from './useDismiss';

const message = (err: unknown) => (err instanceof ApiError ? err.message : 'Could not load notifications.');

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  // The number on the bell: now, then again every 30 s and whenever the tab becomes visible.
  // A failure is ignored: the old number stays and the next check tries again.
  const refreshCount = useCallback(async () => {
    try {
      const { count } = await apiFetch<{ count: number }>('/api/notifications/unread-count');
      setUnread(count);
    } catch {
      /* keep the old number */
    }
  }, []);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') void refreshCount();
    };
    const first = setTimeout(check, 0); // first check right after the page loads
    const timer = setInterval(check, NOTIFICATION_POLL_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [refreshCount]);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await apiFetch<NotificationListResponse>(`/api/notifications?limit=${NOTIFICATION_PAGE_SIZE}`);
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadMore() {
    if (nextCursor === null || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const page = await apiFetch<NotificationListResponse>(
        `/api/notifications?limit=${NOTIFICATION_PAGE_SIZE}&before=${nextCursor}`,
      );
      setItems((list) => [...(list ?? []), ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoadingMore(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      void loadFirstPage(); // always show fresh data when the pop-up opens
      void refreshCount();
    }
  }

  // Click a notification: mark it read (the screen updates at once), then go to what it is about.
  function openItem(n: NotificationRow) {
    close();
    if (!n.isRead) {
      setItems((list) => list?.map((x) => (x.notificationId === n.notificationId ? { ...x, isRead: true } : x)) ?? null);
      setUnread((c) => Math.max(0, c - 1));
      apiFetch(`/api/notifications/${n.notificationId}`, { method: 'PATCH', json: { isRead: true } }).catch(() => {
        void refreshCount(); // the save failed: show the real number again
      });
    }
    const href = notificationHref(n);
    if (href) router.push(href);
  }

  async function markAllRead() {
    setItems((list) => list?.map((x) => ({ ...x, isRead: true })) ?? null);
    setUnread(0);
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
    } catch {
      void refreshCount();
      void loadFirstPage();
    }
  }

  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        className={`relative grid h-10 w-10 place-items-center rounded-full text-vl-on-bar hover:bg-vl-bar-hover ${barFocus}`}
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute top-0 right-0 min-w-[18px] rounded-full bg-[#b3261e] px-1 text-center text-[11px] leading-[18px] font-semibold text-white ring-2 ring-vl-bar"
          >
            {badgeText(unread)}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          items={items}
          loading={loading}
          error={error}
          unread={unread}
          hasMore={nextCursor !== null}
          loadingMore={loadingMore}
          onOpenItem={openItem}
          onMarkAllRead={markAllRead}
          onLoadMore={loadMore}
          onRetry={loadFirstPage}
        />
      )}
    </div>
  );
}