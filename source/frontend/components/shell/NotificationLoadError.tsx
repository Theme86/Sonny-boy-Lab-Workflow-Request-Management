// components/shell/NotificationLoadError.tsx — shown when the first page could not be loaded.
import { ui } from '@/lib/ui';

type Props = { error: string; onRetry: () => void };

export function NotificationLoadError({ error, onRetry }: Props) {
  return (
    <div className="px-4 py-8 text-center text-sm">
      <p className={ui.errorText}>{error}</p>
      <button type="button" onClick={onRetry} className={`${ui.btnText} mt-2`}>
        Try again
      </button>
    </div>
  );
}