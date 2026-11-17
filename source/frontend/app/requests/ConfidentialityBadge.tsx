// app/requests/ConfidentialityBadge.tsx — a small "Restricted / Internal / Public" tag for industry collaboration requests.
import { CONFIDENTIALITY_LABELS } from '@/lib/requests';

const STYLES: Record<string, string> = {
  restricted: 'bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-200',
  internal: 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200',
  public: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-400/20 dark:text-zinc-300',
};

export default function ConfidentialityBadge({ level }: { level: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[level] ?? STYLES.public}`}>
      {level === 'restricted' ? '🔒 ' : ''}
      {CONFIDENTIALITY_LABELS[level] ?? level}
    </span>
  );
}