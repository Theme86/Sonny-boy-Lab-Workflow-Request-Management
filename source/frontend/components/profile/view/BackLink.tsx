// components/profile/view/BackLink.tsx — "← Users" for the Lab Manager, "← Personal info" for everyone else.
import Link from 'next/link';
import { ArrowBackIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import type { User } from '@/lib/users';

export function BackLink({ me }: { me: User | null }) {
  const manager = me?.role === 'lab_manager';
  return (
    <Link href={manager ? '/users' : '/profile'} className={`mb-6 inline-flex items-center gap-2 rounded-full py-2 pr-4 pl-2 text-sm ${ui.hover} ${ui.focus}`}>
      <ArrowBackIcon />
      {manager ? 'Users' : 'Personal info'}
    </Link>
  );
}
