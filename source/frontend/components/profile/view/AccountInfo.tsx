// components/profile/view/AccountInfo.tsx — member since, last sign-in and status.
import { StatusBadge } from '@/components/RoleBadge';
import { formatDate, type User } from '@/lib/users';
import { InfoRow, InfoSection } from './InfoSection';

export function AccountInfo({ user, showEmail }: { user: User; showEmail: boolean }) {
  return (
    <InfoSection title="Account" className={showEmail ? 'xl:col-span-2' : ''}>
      {showEmail && <InfoRow label="Email">{user.email}</InfoRow>}
      <InfoRow label="Member since">{formatDate(user.createdAt)}</InfoRow>
      <InfoRow label="Last sign-in">{formatDate(user.lastLoginAt, true)}</InfoRow>
      <InfoRow label="Status">
        <StatusBadge active={user.active} />
      </InfoRow>
    </InfoSection>
  );
}
