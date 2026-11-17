// components/shell/NotificationBell.tsx — the bell in the top bar, next to the account button.
// Shows the unread number (refreshed every 30 s), and opens a pop-up with the newest notifications.
'use client';

import { useNotificationBell } from '@/hooks/notifications/useNotificationBell';
import { NotificationBellButton } from './NotificationBellButton';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const { open, ref, unread, list, toggle, openItem, markAllRead } = useNotificationBell();
  return (
    <div className="relative" ref={ref}>
      <NotificationBellButton open={open} unread={unread} onToggle={toggle} />
      {open && (
        <NotificationPanel
          items={list.items}
          loading={list.loading}
          error={list.error}
          unread={unread}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          onOpenItem={openItem}
          onMarkAllRead={markAllRead}
          onLoadMore={list.loadMore}
          onRetry={list.loadFirstPage}
        />
      )}
    </div>
  );
}