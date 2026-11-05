// components/users/NameBlock.tsx — avatar, name, email and ID of a person, linking to their profile.
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { ui } from '@/lib/ui';
import { fullName, type User } from '@/lib/users';

export function NameBlock({ user, isMe }: { user: User; isMe: boolean }) {
  const extra = [user.studentId, user.department].filter(Boolean).join(', ');
  return (
    <Link href={`/users/${user.userId}`} className={`flex min-w-0 items-center gap-3 rounded-lg ${ui.focus}`}>
      <Avatar user={user} size="md" />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium hover:underline">
          {fullName(user)}
          {isMe && <span className={`ml-1 text-sm font-normal ${ui.muted}`}>(you)</span>}
        </span>
        <span className={`block truncate text-xs ${ui.muted}`}>{user.email}</span>
        {extra && <span className={`block truncate text-xs ${ui.muted}`}>{extra}</span>}
      </span>
    </Link>
  );
}
