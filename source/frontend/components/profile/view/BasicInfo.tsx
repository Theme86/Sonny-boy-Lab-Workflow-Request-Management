// components/profile/view/BasicInfo.tsx — picture, name, role, department and bio.
import { Avatar } from '@/components/Avatar';
import { ui } from '@/lib/ui';
import { fullName, ROLE_LABELS } from '@/lib/users';
import { InfoRow, InfoSection } from './InfoSection';
import { missing, type DetailProps } from './missing';

export function BasicInfo({ user, editable }: DetailProps) {
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
