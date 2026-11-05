// lib/ui.ts — shared class names so every page uses the same look: soft grey canvas, white panels with a hairline border.
// One corner radius (6px, rounded-md) for cards, buttons, inputs and selects; no shadows.
// Colors come from the vl-* theme tokens in app/globals.css (blue-tinted light mode, purple dark mode), so no dark: twin is needed;
// only danger red and the neutral input outline are still fixed hex.

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vl-accent';

export const ui = {
  page: 'bg-vl-canvas text-vl-ink',
  surface: 'bg-vl-canvas',
  muted: 'text-vl-muted',
  border: 'border-vl-line',
  card: 'rounded-md border border-vl-line bg-vl-surface',
  hover: 'hover:bg-vl-hover',
  link: `rounded font-medium text-vl-accent hover:underline ${focus}`,

  btnPrimary: `inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-vl-accent px-4 text-sm font-medium text-vl-on-accent transition-colors hover:bg-vl-accent-hover disabled:cursor-not-allowed disabled:bg-vl-ink/10 disabled:text-vl-ink/40 ${focus}`,
  btnOutline: `inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#747775] px-4 text-sm font-medium text-vl-accent transition-colors hover:bg-vl-accent/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#8e918f] dark:hover:bg-vl-accent/10 ${focus}`,
  btnText: `inline-flex h-10 shrink-0 items-center justify-center rounded-md px-4 text-sm font-medium text-vl-accent transition-colors hover:bg-vl-accent/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-vl-accent/10 ${focus}`,
  btnDanger: `inline-flex h-9 shrink-0 items-center justify-center rounded-md px-4 text-sm font-medium text-[#b3261e] transition-colors hover:bg-[#b3261e]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#f2b8b5] dark:hover:bg-[#f2b8b5]/10 ${focus}`,

  input:
    'block w-full rounded-md border border-[#747775] bg-vl-surface px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-vl-muted/70 focus:border-vl-accent focus:ring-1 focus:ring-vl-accent disabled:cursor-not-allowed disabled:border-vl-line disabled:text-vl-muted dark:border-[#8e918f]',
  inputError: 'border-[#b3261e] focus:border-[#b3261e] focus:ring-[#b3261e] dark:border-[#f2b8b5] dark:focus:border-[#f2b8b5] dark:focus:ring-[#f2b8b5]',
  select:
    'h-10 rounded-md border border-[#747775] bg-vl-surface px-3 text-sm outline-none focus:border-vl-accent focus:ring-1 focus:ring-vl-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#8e918f]',

  errorText: 'text-[#b3261e] dark:text-[#f2b8b5]',
  focus,
};
