// components/dashboard/UsageBar.tsx — a meter showing how much of something is in use.
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';

export function UsageBar({ used, total }: { used: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((used / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>
          In use <span className="tabular-nums" style={{ fontFamily: monoFamily }}>{used}</span>
        </span>
        <span className={`tabular-nums ${ui.muted}`} style={{ fontFamily: monoFamily }}>
          {percent}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#80868b]/15" role="meter" aria-label="Equipment in use" aria-valuemin={0} aria-valuemax={total} aria-valuenow={used}>
        <div className="h-full rounded-full bg-[#00897b] dark:bg-[#5ad8cc]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
