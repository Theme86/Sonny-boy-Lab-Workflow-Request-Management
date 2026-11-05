// components/dashboard/Panel.tsx — a dashboard card: a small mono label like a scope channel name, then the content.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';

interface PanelProps {
  label: string;
  /** Where "Open" goes; leave out for a card that has no page of its own. */
  href?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ label, href, children, className = '' }: PanelProps) {
  return (
    <section className={`${ui.card} flex flex-col p-5 ${className}`} aria-label={label}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-xs font-medium tracking-[0.12em] uppercase ${ui.muted}`} style={{ fontFamily: monoFamily }}>
          {label}
        </h2>
        {href && (
          <Link href={href} className={`text-sm ${ui.link}`}>
            Open
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

/** One line saying there is nothing to show (instead of a row of zeros). */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className={`text-sm ${ui.muted}`}>{children}</p>;
}
