// components/profile/view/ProfileDetails.tsx
// All profile sections. `editable` = it's your own profile: rows link to the edit page and
// empty values invite you to add them.
import { AccountInfo } from './AccountInfo';
import { BasicInfo } from './BasicInfo';
import { ContactInfo } from './ContactInfo';
import type { DetailProps } from './missing';

export function ProfileDetails({ user, editable }: DetailProps) {
  const showPrivate = user.studentId !== undefined || user.phone !== undefined;
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <BasicInfo user={user} editable={editable} />
      {showPrivate && <ContactInfo user={user} editable={editable} />}
      <AccountInfo user={user} showEmail={!showPrivate} />
    </div>
  );
}
