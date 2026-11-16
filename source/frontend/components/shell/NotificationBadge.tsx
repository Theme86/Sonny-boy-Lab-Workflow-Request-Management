// components/shell/NotificationBadge.tsx — the red number on the bell (not shown when it is 0).
import { badgeText } from '@/lib/notifications';

export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className="absolute top-0 right-0 min-w-[18px] rounded-full bg-[#b3261e] px-1 text-center text-[11px] leading-[18px] font-semibold text-white ring-2 ring-vl-bar"
    >
      {badgeText(count)}
    </span>
  );
}