// components/dashboard/Section.tsx — a titled block on the dashboard: heading (with an optional count) and a
// "View all" link above one bordered surface. Rows inside are separated by hairlines, not nested cards.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { dash } from '@/lib/dashboardUi';

interface SectionProps {
  title: string;
  count?: number;
  href?: string;
  linkText?: string;
  id?: string;
  children: ReactNode;
}

export function Section({ title, count, href, linkText = 'View all', id, children }: SectionProps) {
  return (
    <section id={id} aria-label={title} className="scroll-mt-24">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className={dash.heading}>
          {title}
          {count !== undefined && <span className={`ml-2 font-normal ${dash.muted} ${dash.num}`}>{count}</span>}
        </h2>
        {href && (
          <Link href={href} className={`text-sm ${dash.link}`}>
            {linkText}
          </Link>
        )}
      </div>
      <div className={dash.surface}>{children}</div>
    </section>
  );
}

/** One plain sentence when a section has nothing, with at most one next step. */
export function EmptyLine({ children, action }: { children: ReactNode; action?: { href: string; label: string } }) {
  return (
    <p className={`px-4 py-3 text-sm ${dash.muted}`}>
      {children}
      {action && (
        <>
          {' '}
          <Link href={action.href} className={dash.link}>
            {action.label}
          </Link>
        </>
      )}
    </p>
  );
}
