// components/consumables/ui/styles.ts — class names for the consumables page, built on the shared tokens in lib/ui.ts.
import { ui } from '@/lib/ui';

export const btn = {
  primary: ui.btnPrimary,
  secondary: ui.btnOutline,
  text: ui.btnText,
  danger: `inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#b3261e] px-6 text-sm font-medium text-white transition-colors hover:bg-[#9c2019] dark:bg-[#f2b8b5] dark:text-[#601410] ${ui.focus}`,
  dangerText: ui.btnDanger,
};

export const inputClass = (invalid = false) => `${ui.input} ${invalid ? ui.inputError : ''}`;
export const selectCls = ui.select;
export const labelCls = 'text-sm font-medium';
