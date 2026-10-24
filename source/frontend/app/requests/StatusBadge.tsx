import { STATUS_LABELS, STATUS_STYLES } from '@/lib/requests';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-400/20 dark:text-zinc-300'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
