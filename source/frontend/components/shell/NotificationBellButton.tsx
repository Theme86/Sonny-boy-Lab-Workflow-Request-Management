// components/shell/NotificationBellButton.tsx — the round bell button in the top bar.
import { BellIcon } from './BellIcon';
import { barFocus } from './navStyles';
import { NotificationBadge } from './NotificationBadge';

type Props = { open: boolean; unread: number; onToggle: () => void };

export function NotificationBellButton({ open, unread, onToggle }: Props) {
  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={label}
      className={`relative grid h-10 w-10 place-items-center rounded-full text-vl-on-bar hover:bg-vl-bar-hover ${barFocus}`}
    >
      <BellIcon />
      <NotificationBadge count={unread} />
    </button>
  );
}