// components/profile/view/ProfileDetails.tsx
// All profile sections. `editable` = it's your own profile: rows link to the edit page and
// empty values invite you to add them.
import type { ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/RoleBadge';
import { ui } from '@/lib/ui';
import { formatDate, fullName, ROLE_LABELS, type User } from '@/lib/users';
import { InfoRow, InfoSection } from './InfoSection';

type Props = { user: User; editable: boolean };

const Empty = ({ children }: { children: ReactNode }) => <span className={ui.muted}>{children}</span>;
const missing = (editable: boolean, text: string) => <Empty>{editable ? text : 'Not provided'}</Empty>;

function BasicInfo({ user, editable }: Props) {
  const edit = editable ? '/profile/edit' : undefined;
  return (
    <InfoSection
      className="xl:col-span-2"
      title="Basic info"
      description={editable ? 'Other people in the lab can see this information.' : undefined}
    >
      <InfoRow label="Profile picture" href={edit} aside={<Avatar user={user} size="md" className="hidden sm:inline-flex" />}>
        {editable ? <span className={ui.muted}>A photo helps the lab team recognise you</span> : <Avatar user={user} size="md" className="sm:hidden" />}
      </InfoRow>
      <InfoRow label="Name" href={edit}>
        {fullName(user)}
      </InfoRow>
      <InfoRow label="Role">{ROLE_LABELS[user.role]}</InfoRow>
      <InfoRow label="Faculty / department" href={edit}>
        {user.department || missing(editable, 'Add your faculty or department')}
      </InfoRow>
      <InfoRow label="About" href={edit}>
        {user.bio ? <span className="whitespace-pre-line">{user.bio}</span> : missing(editable, 'Add a short bio')}
      </InfoRow>
    </InfoSection>
  );
}

function ContactInfo({ user, editable }: Props) {
  const edit = editable ? '/profile/edit' : undefined;
  const description = editable
    ? 'Only you and the Lab Manager can see your student / staff ID and phone number.'
    : 'Visible to you as Lab Manager.';
  return (
    <InfoSection title="Contact info and ID" description={description}>
      <InfoRow label="Email">{user.email}</InfoRow>
      <InfoRow label="Phone" href={edit}>
        {user.phone || missing(editable, 'Add a phone number')}
      </InfoRow>
      <InfoRow label="Student / staff ID" href={edit}>
        {user.studentId || missing(editable, 'Add your student or staff ID')}
      </InfoRow>
    </InfoSection>
  );
}

function AccountInfo({ user, showEmail }: { user: User; showEmail: boolean }) {
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

export function ProfileDetails({ user, editable }: Props) {
  const showPrivate = user.studentId !== undefined || user.phone !== undefined;
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <BasicInfo user={user} editable={editable} />
      {showPrivate && <ContactInfo user={user} editable={editable} />}
      <AccountInfo user={user} showEmail={!showPrivate} />
    </div>
  );
}
