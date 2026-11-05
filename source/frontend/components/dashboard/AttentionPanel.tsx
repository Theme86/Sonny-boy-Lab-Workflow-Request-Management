// components/dashboard/AttentionPanel.tsx — work waiting for you. The server only sends the parts your role may act on,
// so each readout appears only when its number is present.
import type { Attention } from '@/lib/dashboardTypes';
import { ui } from '@/lib/ui';
import { attentionItems } from './attentionItems';
import { Panel } from './Panel';
import { Readout } from './Readout';

export function AttentionPanel({ attention }: { attention: Attention }) {
  const items = attentionItems(attention);
  const repairs = attention.requests?.underMaintenance ?? [];

  return (
    <Panel label="Needs attention" channel="amber">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <Readout key={item.label} {...item} />
        ))}
      </div>
      {repairs.length > 0 && (
        <p className={`mt-5 border-t pt-4 text-sm ${ui.border} ${ui.muted}`}>
          Under maintenance: {repairs.map((r) => r.name).join(', ')}
        </p>
      )}
    </Panel>
  );
}
