// lib/ui.ts — shared class names so every page uses the same quiet, formal look.
// Colors: ink #1f1f1f, secondary #5f6368, outline #dadce0, primary #1558b0, danger #b3261e.

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1558b0] dark:focus-visible:outline-[#a8c7fa]';

export const ui = {
  page: 'bg-white text-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-[#e3e3e3]',
  muted: 'text-[#5f6368] dark:text-[#9aa0a6]',
  border: 'border-[#dadce0] dark:border-[#3c4043]',
  card: 'rounded-lg border border-[#dadce0] bg-white dark:border-[#3c4043] dark:bg-[#1f1f1f]',
  hover: 'hover:bg-[#f1f3f4] dark:hover:bg-[#2d2e30]',
  link: `rounded font-medium text-[#1558b0] hover:underline dark:text-[#a8c7fa] ${focus}`,

  btnPrimary: `inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#1558b0] px-6 text-sm font-medium text-white transition-colors hover:bg-[#124c99] disabled:cursor-not-allowed disabled:bg-[#1f1f1f]/10 disabled:text-[#1f1f1f]/40 dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#c2d7fb] dark:disabled:bg-white/10 dark:disabled:text-white/40 ${focus}`,
  btnOutline: `inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[#747775] px-6 text-sm font-medium text-[#1558b0] transition-colors hover:bg-[#1558b0]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#8e918f] dark:text-[#a8c7fa] dark:hover:bg-[#a8c7fa]/10 ${focus}`,
  btnText: `inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium text-[#1558b0] transition-colors hover:bg-[#1558b0]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#a8c7fa] dark:hover:bg-[#a8c7fa]/10 ${focus}`,
  btnDanger: `inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium text-[#b3261e] transition-colors hover:bg-[#b3261e]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#f2b8b5] dark:hover:bg-[#f2b8b5]/10 ${focus}`,

  input:
    'block w-full rounded border border-[#747775] bg-transparent px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-[#5f6368]/70 focus:border-[#1558b0] focus:ring-1 focus:ring-[#1558b0] disabled:cursor-not-allowed disabled:border-[#dadce0] disabled:text-[#5f6368] dark:border-[#8e918f] dark:focus:border-[#a8c7fa] dark:focus:ring-[#a8c7fa] dark:disabled:border-[#3c4043] dark:disabled:text-[#9aa0a6]',
  inputError: 'border-[#b3261e] focus:border-[#b3261e] focus:ring-[#b3261e] dark:border-[#f2b8b5] dark:focus:border-[#f2b8b5] dark:focus:ring-[#f2b8b5]',
  select:
    'h-10 rounded border border-[#747775] bg-transparent px-3 text-sm outline-none focus:border-[#1558b0] focus:ring-1 focus:ring-[#1558b0] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#8e918f] dark:bg-[#1f1f1f] dark:focus:border-[#a8c7fa] dark:focus:ring-[#a8c7fa]',

  errorText: 'text-[#b3261e] dark:text-[#f2b8b5]',
  focus,
};
