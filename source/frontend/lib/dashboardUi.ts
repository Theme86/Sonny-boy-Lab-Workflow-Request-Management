// lib/dashboardUi.ts — the dashboard's design tokens, one value per axis so the page stays coherent:
// one corner radius (6px, rounded-md), hairline rules instead of shadows, one accent colour (#1558b0) for the main action,
// controls 40px high like the shared buttons and inputs in lib/ui.ts, four type sizes (12 / 14 / 16 / 22 px), sentence-case labels (no uppercase, no letter-spacing — Thai doesn't use it).
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1558b0] dark:focus-visible:outline-[#a8c7fa]';

export const dash = {
  surface: 'rounded-md border border-[#e3e6ec] bg-white dark:border-[#3c4043] dark:bg-[#1e1f20]',
  rule: 'border-[#e3e6ec] dark:border-[#3c4043]',
  rows: 'divide-y divide-[#e3e6ec] dark:divide-[#3c4043]',
  muted: 'text-[#5b6472] dark:text-[#9aa0a6]',
  title: 'text-[22px] leading-7 font-semibold',
  heading: 'text-base font-semibold',
  label: 'text-xs font-medium text-[#5b6472] dark:text-[#9aa0a6]',
  /** numbers that line up in columns */
  num: 'tabular-nums',
  link: `rounded-sm font-medium text-[#1558b0] hover:underline dark:text-[#a8c7fa] ${focus}`,
  btnPrimary: `inline-flex h-10 items-center rounded-md bg-[#1558b0] px-4 text-sm font-medium text-white hover:bg-[#124c99] dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#c2d7fb] ${focus}`,
  btnSecondary: `inline-flex h-10 items-center rounded-md border border-[#c4c9d2] bg-white px-4 text-sm font-medium hover:bg-[#f1f3f4] dark:border-[#5f6368] dark:bg-transparent dark:hover:bg-[#2d2e30] ${focus}`,
  focus,
};
