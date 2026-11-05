// components/dashboard/Panel.tsx — a dashboard card: a channel mark and a small mono label like a scope channel name,
// an optional "View all" link, then the content.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@/components/icons';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';
import { CHANNEL_MARK, type Channel } from './tones';

interface PanelProps {
  label: string;
  channel?: Channel;
  /** Where "View all" goes; leave out for a card that has no page of its own. */
  href?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Panel({ label, channel = 'blue', href, children, className = '', id }: PanelProps) {
  return (
    <section id={id} className={`${ui.card} flex scroll-mt-24 flex-col p-5 ${className}`} aria-label={label}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase ${ui.muted}`} style={{ fontFamily: monoFamily }}>
          <span className={`h-2 w-2 rounded-[2px] ${CHANNEL_MARK[channel]}`} aria-hidden />
          {label}
        </h2>
        {href && (
          <Link href={href} className={`inline-flex items-center gap-0.5 text-sm ${ui.link}`}>
            View all
            <ChevronRightIcon width={16} height={16} aria-hidden />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
