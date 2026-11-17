// hooks/notifications/useUnreadCount.ts — the number on the bell: now, then every 30 s and whenever the tab becomes visible.
import { useCallback, useEffect, useState } from 'react';
import { fetchUnreadCount } from '@/lib/notificationApi';
import { NOTIFICATION_POLL_MS } from '@/lib/notifications';

export function useUnreadCount() {
  const [unread, setUnread] = useState(0);

  // A failure is ignored: the old number stays and the next check tries again.
  const refreshCount = useCallback(async () => {
    try {
      const { count } = await fetchUnreadCount();
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

  return { unread, setUnread, refreshCount };
}