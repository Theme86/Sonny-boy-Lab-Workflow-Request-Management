// components/dashboard/DashboardStates.tsx — what the page shows while loading and when loading failed.
import { dash } from '@/lib/dashboardUi';
import { ui } from '@/lib/ui';

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" role="status" aria-label="Loading dashboard">
      {[0, 1].map((i) => (
        <div key={i} className={`${dash.surface} h-48 animate-pulse motion-reduce:animate-none`} />
      ))}
    </div>
  );
}

export function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={`${dash.surface} p-4`} role="alert">
      <p className={ui.errorText}>{message}</p>
      <button type="button" onClick={onRetry} className={`${dash.btnSecondary} mt-3`}>
        Try again
      </button>
    </div>
  );
}
