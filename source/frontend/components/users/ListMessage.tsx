// components/users/ListMessage.tsx — "Loading users…" / "No users match your search" under the list.
import { ui } from '@/lib/ui';
import type { UserListResponse } from '@/lib/users';

export function ListMessage({ data, loading }: { data: UserListResponse | null; loading: boolean }) {
  const text = data ? (data.users.length === 0 ? 'No users match your search. Try a different name or clear the filters.' : '') : loading ? 'Loading users…' : '';
  return text ? <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>{text}</p> : null;
}
