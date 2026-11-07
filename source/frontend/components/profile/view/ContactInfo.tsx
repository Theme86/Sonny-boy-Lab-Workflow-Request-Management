// components/profile/view/ContactInfo.tsx — email, phone and student / staff ID (private details).
import { InfoRow, InfoSection } from './InfoSection';
import { missing, type DetailProps } from './missing';

export function ContactInfo({ user, editable }: DetailProps) {
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
