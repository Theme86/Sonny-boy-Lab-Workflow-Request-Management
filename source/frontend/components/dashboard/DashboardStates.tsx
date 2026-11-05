// components/dashboard/DashboardStates.tsx — what the page shows while loading and when loading failed.
import { ui } from '@/lib/ui';

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading dashboard">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`${ui.card} h-44 animate-pulse motion-reduce:animate-none`} />
      ))}
    </div>
  );
}

export function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={`${ui.card} p-6`} role="alert">
      <p className={ui.errorText}>{message}</p>
      <button type="button" onClick={onRetry} className={`${ui.btnOutline} mt-4`}>
        Try again
      </button>
    </div>
  );
}
