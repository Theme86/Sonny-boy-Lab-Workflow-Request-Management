// components/shell/NotificationFooter.tsx — under the list: an error from "Show older" and the "Show older" button.
import { ui } from '@/lib/ui';

type Props = { hasMore: boolean; error: string; loadingMore: boolean; onLoadMore: () => void };

export function NotificationFooter({ hasMore, error, loadingMore, onLoadMore }: Props) {
  return (
    <div className={`border-t px-4 py-2 text-center ${ui.border}`}>
      {error && <p className={`mb-1 text-xs ${ui.errorText}`}>{error}</p>}
      {hasMore && (
        <button type="button" onClick={onLoadMore} disabled={loadingMore} className={ui.btnText}>
          {loadingMore ? 'Loading…' : 'Show older'}
        </button>
      )}
    </div>
  );
}