// components/dashboard/ConsumablesPanel.tsx — supplies running low and supplies expiring, with their hazards.
import type { Dashboard } from '@/lib/dashboardTypes';
import { ConsumableRow, expiryDetail, Group, stockDetail } from './ConsumableRow';
import { EmptyState } from './EmptyState';
import { Panel } from './Panel';

type ConsumableSummary = Dashboard['lab']['consumables'];

/** Either nothing is tracked yet, or everything tracked is fine. */
function NothingToFlag({ tracked }: { tracked: number }) {
  if (tracked === 0) {
    return <EmptyState art="search" title="No consumables tracked" body="Chemicals and supplies added on the Consumables page are watched for low stock and expiry." />;
  }
  return <EmptyState art="damped" title="Stock levels are fine" body={`Nothing is running low or close to expiry (${tracked} items tracked).`} />;
}

export function ConsumablesPanel({ consumables }: { consumables: ConsumableSummary }) {
  const { lowStock, expiring } = consumables;
  const allFine = lowStock.total === 0 && expiring.total === 0;

  return (
    <Panel label="Consumables" channel="teal" href="/consumables">
      {allFine ? (
        <NothingToFlag tracked={consumables.total} />
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
