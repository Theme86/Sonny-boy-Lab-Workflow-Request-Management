// components/users/ActiveButton.tsx — "Deactivate" / "Reactivate" for a user row (not shown for yourself).
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';
import type { RowActions } from './rowActions';

export function ActiveButton({ user, actions }: { user: User; actions: RowActions }) {
  if (user.userId === actions.me.userId) return null;
  return (
    <button
      type="button"
      onClick={() => actions.toggleActive(user)}
      disabled={actions.busyId === user.userId}
      className={user.active ? ui.btnDanger : `${ui.btnText} h-9`}
    >
      {user.active ? 'Deactivate' : 'Reactivate'}
    </button>
  );
}
