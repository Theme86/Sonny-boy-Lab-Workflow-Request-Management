// components/dashboard/StatusText.tsx — a status written as a word. Colour only where something needs attention,
// and never colour alone: the word is always there.
import { STATUS_LABELS } from '@/lib/requests';

type Tone = 'plain' | 'ok' | 'warn' | 'fault';

const TONE_CLASS: Record<Tone, string> = {
  plain: 'text-vl-muted',
  ok: 'text-[#1a7f37] dark:text-[#7ee2a0]',
  warn: 'text-[#8a5a00] dark:text-[#f9ab00]',
  fault: 'text-[#b3261e] dark:text-[#f2b8b5]',
};

const SESSION_LABELS: Record<string, string> = {
  pending_approval: 'Waiting for approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const TONES: Record<string, Tone> = {
  approved: 'ok',
  scheduled: 'ok',
  in_progress: 'ok',
  completed: 'plain',
  pending_approval: 'warn',
  in_review: 'warn',
  blocked: 'fault',
  rejected: 'fault',
};

export const statusLabel = (status: string, kind: 'request' | 'session') =>
  (kind === 'session' ? SESSION_LABELS[status] : STATUS_LABELS[status]) ?? status;

export function StatusText({ status, kind }: { status: string; kind: 'request' | 'session' }) {
  return <span className={`text-sm ${TONE_CLASS[TONES[status] ?? 'plain']}`}>{statusLabel(status, kind)}</span>;
}

export const toneClass = (tone: Tone) => TONE_CLASS[tone];
