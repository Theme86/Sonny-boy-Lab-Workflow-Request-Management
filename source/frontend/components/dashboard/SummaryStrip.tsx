// components/dashboard/SummaryStrip.tsx — one wide card with four readouts, like the measurement bar under a scope screen.
import Link from 'next/link';
import type { Dashboard } from '@/lib/dashboardTypes';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';
import { summaryReadouts } from './summaryReadouts';
import { CHANNEL_MARK, TONE_TEXT } from './tones';

export function SummaryStrip({ data }: { data: Dashboard }) {
  return (
    <ul className={`${ui.card} grid grid-cols-2 overflow-hidden lg:grid-cols-4`} aria-label="Summary">
      {summaryReadouts(data).map((r, i) => (
        <li key={r.label} className={`${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} ${ui.border}`}>
          <Link href={r.href} className={`block h-full px-5 py-4 transition-colors ${ui.hover} ${ui.focus}`}>
            <span className={`flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase ${ui.muted}`} style={{ fontFamily: monoFamily }}>
              <span className={`h-2 w-2 rounded-[2px] ${CHANNEL_MARK[r.channel]}`} aria-hidden />
              {r.label}
            </span>
            <span className={`mt-2 block text-[30px] leading-none font-medium tabular-nums ${TONE_TEXT[r.tone]}`} style={{ fontFamily: monoFamily }}>
              {r.value}
            </span>
            <span className={`mt-1.5 block text-xs ${ui.muted}`}>{r.caption}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
