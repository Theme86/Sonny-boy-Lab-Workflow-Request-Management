// hooks/notifications/useNotificationBell.ts — everything the bell does: open / close, clicks, "mark all as read".
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { useDismiss } from '@/components/shell/useDismiss';
import { saveAllRead, saveRead } from '@/lib/notificationApi';
import { notificationHref, type NotificationRow } from '@/lib/notifications';
import { useNotificationList } from './useNotificationList';
import { useUnreadCount } from './useUnreadCount';

export function useNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  const { unread, setUnread, refreshCount } = useUnreadCount();
  const list = useNotificationList();

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      void list.loadFirstPage(); // always show fresh data when the pop-up opens
      void refreshCount();
    }
  }

  // Click a notification: mark it read (the screen updates at once), then go to what it is about.
  function openItem(n: NotificationRow) {
    close();
    if (!n.isRead) {
      list.markRead(n.notificationId);
      setUnread((c) => Math.max(0, c - 1));
      saveRead(n.notificationId).catch(() => {
        void refreshCount(); // the save failed: show the real number again
      });
    }
    const href = notificationHref(n);
    if (href) router.push(href);
  }

  async function markAllRead() {
    list.markAllShownRead();
    setUnread(0);
    try {
      await saveAllRead();
    } catch {
      void refreshCount();
      void list.loadFirstPage();
    }
  }

  return { open, ref, unread, list, toggle, openItem, markAllRead };
}