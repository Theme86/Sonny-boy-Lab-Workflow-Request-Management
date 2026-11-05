// lib/dashboardUi.ts — the dashboard's design tokens, one value per axis so the page stays coherent:
// one corner radius (6px, rounded-md), hairline rules instead of shadows, one accent colour (vl-accent: blue, purple in dark mode) for the main action,
// controls 40px high like the shared buttons and inputs in lib/ui.ts, four type sizes (12 / 14 / 16 / 22 px), sentence-case labels (no uppercase, no letter-spacing — Thai doesn't use it).
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vl-accent';

export const dash = {
  surface: 'rounded-md border border-vl-line bg-vl-surface',
  rule: 'border-vl-line',
  rows: 'divide-y divide-vl-line',
  muted: 'text-vl-muted',
  title: 'text-[22px] leading-7 font-semibold',
  heading: 'text-base font-semibold',
  label: 'text-xs font-medium text-vl-muted',
  /** numbers that line up in columns */
  num: 'tabular-nums',
  link: `rounded-sm font-medium text-vl-accent hover:underline ${focus}`,
  btnPrimary: `inline-flex h-10 items-center rounded-md bg-vl-accent px-4 text-sm font-medium text-vl-on-accent hover:bg-vl-accent-hover ${focus}`,
  btnSecondary: `inline-flex h-10 items-center rounded-md border border-vl-line bg-vl-surface px-4 text-sm font-medium hover:bg-vl-hover ${focus}`,
  focus,
};
