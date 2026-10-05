// components/ProfileCard.tsx — banner + avatar + details, used by "my profile" and "view user"
'use client';

import type { ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge, StatusBadge } from '@/components/RoleBadge';
import { imageUrl } from '@/lib/api';
import { formatDate, fullName, type User } from '@/lib/users';

type Props = {
  user: User;
  /** Buttons shown next to the name (e.g. "Edit profile"). */
  actions?: ReactNode;
};

export function ProfileCard({ user, actions }: Props) {
  const banner = imageUrl(user.bannerUrl);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className="h-36 bg-linear-to-r from-emerald-500 to-teal-600 bg-cover bg-center sm:h-48"
        style={banner ? { backgroundImage: `url("${banner}")` } : undefined}
        role="img"
        aria-label="Profile banner"
      />
      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Avatar user={user} size="xl" className="ring-4 ring-white dark:ring-zinc-900" />
          {actions && <div className="flex flex-wrap gap-2 sm:pb-1">{actions}</div>}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{fullName(user)}</h1>
            <RoleBadge role={user.role} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {user.email}
            {user.department && <> · {user.department}</>}
          </p>
          {user.bio && <p className="mt-4 max-w-2xl whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">{user.bio}</p>}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-3 dark:border-zinc-800">
          <Detail label="Faculty / department">{user.department || <NotSet />}</Detail>
          {/* undefined = hidden from this viewer (only the user and the Lab Manager see these) */}
          {user.studentId !== undefined && <Detail label="Student / staff ID">{user.studentId || <NotSet />}</Detail>}
          {user.phone !== undefined && (
            <Detail label="Phone">
              {user.phone ? (
                <a href={`tel:${user.phone.replace(/[\s-]/g, '')}`} className="hover:underline">
                  {user.phone}
                </a>
              ) : (
                <NotSet />
              )}
            </Detail>
          )}
          <Detail label="Member since">{formatDate(user.createdAt)}</Detail>
          <Detail label="Last login">{formatDate(user.lastLoginAt, true)}</Detail>
          <Detail label="Account status">
            <StatusBadge active={user.active} />
          </Detail>
        </dl>
      </div>
    </section>
  );
}

function NotSet() {
  return <span className="text-zinc-400 dark:text-zinc-500">Not set</span>;
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

export const buttonStyles = {
  primary:
    'inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700',
  danger:
    'inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-red-400 dark:ring-red-900 dark:hover:bg-red-950',
};
