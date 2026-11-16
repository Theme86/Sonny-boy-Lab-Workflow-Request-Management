// components/shell/NotificationNote.tsx — a short grey line in the middle of the pop-up ("Loading…", "You're all caught up.").
import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';

export function NotificationNote({ children }: { children: ReactNode }) {
  return <p className={`px-4 py-8 text-center text-sm ${ui.muted}`}>{children}</p>;
}