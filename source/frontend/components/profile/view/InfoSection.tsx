// components/profile/view/InfoSection.tsx — a titled card of "label | value" rows.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@/components/icons';
import { ui } from '@/lib/ui';

export function InfoSection({ title, description, children, className = '' }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`${ui.card} ${className}`}>
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-lg leading-7 font-medium">{title}</h2>
        {description && <p className={`mt-0.5 text-sm ${ui.muted}`}>{description}</p>}
      </div>
      <dl className="pb-2">{children}</dl>
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
      <dt className={`text-xs sm:w-40 sm:shrink-0 sm:text-sm ${ui.muted}`}>{label}</dt>
      <dd className="min-w-0 flex-1 text-base break-words">{children}</dd>
      {aside}
      {href && <ChevronRightIcon className="hidden shrink-0 text-vl-muted sm:block" />}
    </>
  );
  const rowClass = `flex flex-col gap-1 border-t px-6 py-3.5 sm:flex-row sm:items-center sm:gap-4 ${ui.border}`;

  return href ? (
    <Link href={href} className={`${rowClass} ${ui.hover} ${ui.focus} focus-visible:-outline-offset-2`}>
      {content}
    </Link>
  ) : (
    <div className={rowClass}>{content}</div>
  );
}
