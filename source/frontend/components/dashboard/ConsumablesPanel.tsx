// components/dashboard/ConsumablesPanel.tsx — supplies running low and supplies expiring, with their hazards.
import type { Dashboard } from '@/lib/dashboardTypes';
import { ui } from '@/lib/ui';
import { ConsumableRow, expiryDetail, stockDetail } from './ConsumableRow';
import { EmptyNote, Panel } from './Panel';

type ConsumableSummary = Dashboard['lab']['consumables'];

function Group({ title, total, children }: { title: string; total: number; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">
        {title} <span className={`tabular-nums ${ui.muted}`}>{total}</span>
      </h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

export function ConsumablesPanel({ consumables }: { consumables: ConsumableSummary }) {
  const { lowStock, expiring } = consumables;
  const allFine = lowStock.total === 0 && expiring.total === 0;

  return (
    <Panel label="Consumables" href="/consumables" className="md:col-span-2 xl:col-span-3">
      {allFine ? (
        <EmptyNote>Nothing is running low or close to expiry ({consumables.total} items tracked).</EmptyNote>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {lowStock.total > 0 && (
            <Group title="Running low" total={lowStock.total}>
              {lowStock.items.map((item) => (
                <ConsumableRow key={item.consumableId} item={item} detail={stockDetail(item)} tone={item.currentStock === 0 ? 'alert' : 'warn'} />
              ))}
            </Group>
          )}
          {expiring.total > 0 && (
            <Group title="Expiring" total={expiring.total}>
              {expiring.items.map((item) => (
                <ConsumableRow key={item.consumableId} item={item} detail={expiryDetail(item)} tone={item.expiry === 'expired' ? 'alert' : 'warn'} />
              ))}
            </Group>
          )}
        </div>
      )}
    </Panel>
  );
}
