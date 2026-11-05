// components/dashboard/tones.ts — the few colours the dashboard uses.
// Tones say "fine / watch / act". Greens and ambers come from the login illustration; red is the app's danger colour.
// Amber text uses a darker shade on light backgrounds so it passes contrast (bright amber is for dots only).
export type Tone = 'neutral' | 'ok' | 'warn' | 'alert';

export const TONE_TEXT: Record<Tone, string> = {
  neutral: '',
  ok: 'text-[#00796b] dark:text-[#5fe0a0]',
  warn: 'text-[#8a5a00] dark:text-[#f9ab00]',
  alert: 'text-[#b3261e] dark:text-[#f2b8b5]',
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-[#9aa0a6]',
  ok: 'bg-[#00897b] dark:bg-[#5fe0a0]',
  warn: 'bg-[#f9ab00]',
  alert: 'bg-[#e94235] dark:bg-[#ff8a80]',
};

/** Each card gets a channel colour, like the coloured traces on a multi-channel scope. */
export type Channel = 'blue' | 'amber' | 'teal' | 'violet';

export const CHANNEL_MARK: Record<Channel, string> = {
  blue: 'bg-[#1558b0] dark:bg-[#a8c7fa]',
  amber: 'bg-[#f9ab00]',
  teal: 'bg-[#00897b] dark:bg-[#5ad8cc]',
  violet: 'bg-[#7b5ea7] dark:bg-[#c3a6ff]',
};
