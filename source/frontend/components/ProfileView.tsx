// components/ProfileView.tsx — read-only profile layout (my profile and other people's profiles):
// a header with banner + photo, then sections of "label | value" rows.
'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { ChevronRightIcon } from '@/components/icons';
import { RoleBadge, StatusBadge } from '@/components/RoleBadge';
import { imageUrl } from '@/lib/api';
import { ui } from '@/lib/ui';
import { formatDate, fullName, ROLE_LABELS, type User } from '@/lib/users';

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-[28px] leading-9 font-normal sm:text-[32px] sm:leading-10">{title}</h1>
      {subtitle && <p className={`mx-auto mt-2 max-w-xl text-base ${ui.muted}`}>{subtitle}</p>}
    </div>
  );
}

export function ProfileHeader({ user, action }: { user: User; action?: ReactNode }) {
  const banner = imageUrl(user.bannerUrl);
  return (
    <section className={`overflow-hidden ${ui.card}`}>
      <div
        className="h-28 bg-[#e8eaed] bg-cover bg-center sm:h-36 dark:bg-[#303134]"
        style={banner ? { backgroundImage: `url("${banner}")` } : undefined}
        role="img"
        aria-label="Profile banner"
      />
      <div className="px-6 pb-6">
        <div className="-mt-12 flex items-end justify-between gap-4 sm:-mt-14">
          <Avatar user={user} size="xl" className="ring-4 ring-white dark:ring-[#1f1f1f]" />
          {action && <div className="pb-1">{action}</div>}
        </div>
        <h2 className="mt-4 text-[22px] leading-7">{fullName(user)}</h2>
        <p className={`mt-1 text-sm ${ui.muted}`}>{user.email}</p>
        <div className="mt-3">
          <RoleBadge role={user.role} />
        </div>
      </div>
    </section>
  );
}

export function InfoSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={`mt-6 ${ui.card}`}>
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-[22px] leading-7">{title}</h2>
        {description && <p className={`mt-1 text-sm ${ui.muted}`}>{description}</p>}
      </div>
      <dl>{children}</dl>
    </section>
  );
}

type RowProps = {
  label: string;
  children: ReactNode;
  /** Makes the whole row a link (used on your own profile to jump to the edit page). */
  href?: string;
  /** Extra content on the right, e.g. a small photo. */
  aside?: ReactNode;
};

export function InfoRow({ label, children, href, aside }: RowProps) {
  const content = (
    <>
      <dt className={`text-xs sm:w-44 sm:shrink-0 sm:text-sm ${ui.muted}`}>{label}</dt>
      <dd className="min-w-0 flex-1 text-base break-words">{children}</dd>
      {aside}
      {href && <ChevronRightIcon className="hidden shrink-0 text-[#5f6368] sm:block dark:text-[#9aa0a6]" />}
    </>
  );
  const rowClass = `flex flex-col gap-1 border-t px-6 py-4 sm:flex-row sm:items-center sm:gap-4 ${ui.border}`;

  return href ? (
    <Link href={href} className={`${rowClass} ${ui.hover} ${ui.focus} focus-visible:-outline-offset-2`}>
      {content}
    </Link>
  ) : (
    <div className={rowClass}>{content}</div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <span className={ui.muted}>{children}</span>;
}

/**
 * All profile sections. `editable` = it's your own profile: rows link to the edit page and
 * empty values invite you to add them.
 */
export function ProfileDetails({ user, editable }: { user: User; editable: boolean }) {
  const edit = editable ? '/profile/edit' : undefined;
  const missing = (text: string) => <Empty>{editable ? text : 'Not provided'}</Empty>;
  const showPrivate = user.studentId !== undefined || user.phone !== undefined;

  return (
    <>
      <InfoSection
        title="Basic info"
        description={editable ? 'Other people in the lab can see this information.' : undefined}
      >
        <InfoRow
          label="Profile picture"
          href={edit}
          aside={<Avatar user={user} size="md" className="hidden sm:inline-flex" />}
        >
          {editable ? (
            <span className={ui.muted}>A photo helps the lab team recognise you</span>
          ) : (
            <Avatar user={user} size="md" className="sm:hidden" />
          )}
        </InfoRow>
        <InfoRow label="Name" href={edit}>
          {fullName(user)}
        </InfoRow>
        <InfoRow label="Role">{ROLE_LABELS[user.role]}</InfoRow>
        <InfoRow label="Faculty / department" href={edit}>
          {user.department || missing('Add your faculty or department')}
        </InfoRow>
        <InfoRow label="About" href={edit}>
          {user.bio ? <span className="whitespace-pre-line">{user.bio}</span> : missing('Add a short bio')}
        </InfoRow>
      </InfoSection>

      {showPrivate && (
        <InfoSection
          title="Contact info and ID"
          description={editable ? 'Only you and the Lab Manager can see your student / staff ID and phone number.' : 'Visible to you as Lab Manager.'}
        >
          <InfoRow label="Email">{user.email}</InfoRow>
          <InfoRow label="Phone" href={edit}>
            {user.phone || missing('Add a phone number')}
          </InfoRow>
          <InfoRow label="Student / staff ID" href={edit}>
            {user.studentId || missing('Add your student or staff ID')}
          </InfoRow>
        </InfoSection>
      )}

      <InfoSection title="Account">
        {!showPrivate && <InfoRow label="Email">{user.email}</InfoRow>}
        <InfoRow label="Member since">{formatDate(user.createdAt)}</InfoRow>
        <InfoRow label="Last sign-in">{formatDate(user.lastLoginAt, true)}</InfoRow>
        <InfoRow label="Status">
          <StatusBadge active={user.active} />
        </InfoRow>
      </InfoSection>
    </>
  );
}
