// components/dashboard/tones.ts — the few colours the dashboard uses to say "fine / watch / act".
// Greens and ambers come from the login illustration (scope trace, amber data point); red is the app's danger colour.
export type Tone = 'neutral' | 'ok' | 'warn' | 'alert';

export const TONE_TEXT: Record<Tone, string> = {
  neutral: '',
  ok: 'text-[#00796b] dark:text-[#5fe0a0]',
  warn: 'text-[#b06000] dark:text-[#f9ab00]',
  alert: 'text-[#b3261e] dark:text-[#f2b8b5]',
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-[#9aa0a6]',
  ok: 'bg-[#00897b] dark:bg-[#5fe0a0]',
  warn: 'bg-[#f9ab00]',
  alert: 'bg-[#e94235] dark:bg-[#ff8a80]',
};
