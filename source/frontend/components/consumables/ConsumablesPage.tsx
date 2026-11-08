// components/consumables/ConsumablesPage.tsx — the consumables page: summary cards, filters, list, and the pop-ups.
'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { imageUrl as resolveImageUrl } from '@/lib/api';
import type { Consumable, SavePayload } from '@/lib/consumables';
import { ui } from '@/lib/ui';
import type { ItemActions } from './actions';
import { ConsumableFormModal } from './form/ConsumableFormModal';
import { ConsumableGrid } from './list/ConsumableGrid';
import { ConsumableTable } from './list/ConsumableTable';
import { DeleteDialog } from './detail/DeleteDialog';
import { DetailDrawer } from './detail/DetailDrawer';
import { Lightbox, type LightboxImage } from './ui/Lightbox';
import { AddButton, ListEmpty, ListError, ListFooter, ListLoading } from './list/ListStates';
import { StatCards } from './list/StatCards';
import { Toolbar, type View } from './list/Toolbar';
import { useConsumableFilters } from './useConsumableFilters';
import { useConsumables, type PhotoChange } from './useConsumables';
import { useToast } from './ui/useToast';

export function ConsumablesPage() {
  const { user } = useCurrentUser();
  const canManage = user?.role === 'lab_manager' || user?.role === 'lecturer';

  const { items, loading, error, reload, save, remove } = useConsumables();
  const list = useConsumableFilters(items);
  const toast = useToast();

  const [view, setView] = useState<View>('table');
  const [formTarget, setFormTarget] = useState<{ item?: Consumable } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Consumable | null>(null);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  const detailItem = items.find((c) => c.consumableId === detailId) ?? null;
  const openAdd = () => setFormTarget({});

  function openImage(c: Consumable) {
    const src = resolveImageUrl(c.imageUrl);
    if (src) setLightbox({ src, alt: c.name });
  }

  const actions: ItemActions = {
    canManage,
    onOpen: (c) => setDetailId(c.consumableId),
    onEdit: (c) => setFormTarget({ item: c }),
    onDelete: setDeleteTarget,
    onImage: openImage,
  };

  // errors are left to the form, which shows the backend's message
  async function handleSave(data: SavePayload, photo: PhotoChange) {
    toast.show(await save(data, formTarget?.item, photo));
    setFormTarget(null);
  }

  async function handleDelete(item: Consumable) {
    try {
      toast.show(await remove(item));
      setDeleteTarget(null);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  let body;
  if (loading) body = <ListLoading />;
  else if (error) body = <ListError message={error} onRetry={reload} />;
  else if (list.visible.length === 0) {
    body = <ListEmpty noItemsAtAll={items.length === 0} onAdd={canManage ? openAdd : undefined} onClearFilters={list.clear} />;
  } else if (view === 'table') body = <ConsumableTable items={list.visible} actions={actions} />;
  else body = <ConsumableGrid items={list.visible} actions={actions} />;

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-sm font-medium ${ui.muted}`}>Inventory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Consumables</h1>
          <p className={`mt-1 text-sm ${ui.muted}`}>Chemicals and supplies — stock levels, expiry dates and hazards.</p>
        </div>
        {canManage && <AddButton onClick={openAdd} />}
      </header>

      <StatCards
        stats={list.stats}
        status={list.filters.status}
        onShowAll={() => list.update({ status: 'all' })}
        onToggle={list.toggleStatus}
      />

      <div className={`mt-6 overflow-hidden ${ui.card}`}>
        <Toolbar filters={list.filters} units={list.units} view={view} onChange={list.update} onView={setView} />
        {body}
        {!loading && !error && list.visible.length > 0 && (
          <ListFooter shown={list.visible.length} total={items.length} filtered={list.active} onClearFilters={list.clear} />
        )}
      </div>

      {detailItem && (
        <DetailDrawer
          item={detailItem}
          canManage={canManage}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setFormTarget({ item: detailItem });
          }}
          onDelete={() => {
            setDetailId(null);
            setDeleteTarget(detailItem);
          }}
          onPreviewImage={() => openImage(detailItem)}
        />
      )}

      {formTarget && (
        <ConsumableFormModal
          key={formTarget.item?.consumableId ?? 'new'}
          initial={formTarget.item}
          onClose={() => setFormTarget(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteDialog item={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={() => handleDelete(deleteTarget)} />
      )}

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {toast.message && (
        <div role="status" className="fixed bottom-4 right-4 z-[70] rounded-lg bg-vl-ink px-4 py-3 text-sm text-white shadow-lg dark:text-[#1f1f1f]">
          {toast.message}
        </div>
      )}
    </div>
  );
}
