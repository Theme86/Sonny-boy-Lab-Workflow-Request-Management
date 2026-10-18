// app/equipment/page.tsx
'use client';
 
import { useEffect, useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { DeleteIcon, EditIcon, PlusIcon } from '@/components/equipmentIcons';
import { EquipmentModal } from '@/components/EquipmentModal';
import { EquipmentPhoto } from '@/components/EquipmentPhoto';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@/components/icons';
import { PageHeading } from '@/components/ProfileView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { stockLevel, STOCK_LABELS, type Equipment, type EquipmentListResponse, type Stock } from '@/lib/equipment';
import { ui } from '@/lib/ui';

const PAGE_SIZE = 10;
 
// the pop-up is closed, adding a new item, or editing one
type ModalState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; item: Equipment };
 
export default function EquipmentPage() {
  return (
    <AppShell>
      <EquipmentList />
    </AppShell>
  );
}
 
function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
 
const STOCK_DOT: Record<Stock, string> = {
  in: 'bg-[#1e8e3e]',
  low: 'bg-[#f9ab00]',
  out: 'bg-[#b3261e]',
};
 
function StockBadge({ item }: { item: Equipment }) {
  const level = stockLevel(item);
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STOCK_DOT[level]}`} aria-hidden />
      <span>
        <span className="font-medium">
          {item.quantityAvailable} of {item.quantityTotal}
        </span>
        <span className={`ml-1.5 ${ui.muted}`}>{STOCK_LABELS[level]}</span>
      </span>
    </span>
  );
}
 
function EquipmentList() {
  const { user } = useCurrentUser();
  const canManage = user?.role === 'lab_manager';
 
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);
 
  const [result, setResult] = useState<{ key: string; data?: EquipmentListResponse; error?: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [busyId, setBusyId] = useState<number | null>(null);
 
  const q = useDebounced(search.trim());
 
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (q) params.set('q', q);
    if (onlyAvailable) params.set('available', 'true');
    return params.toString();
  }, [q, onlyAvailable, page]);
 
  // reloadCount makes "reload after a save or delete" count as a new request
  const queryKey = `${query}|${reloadCount}`;
 
  useEffect(() => {
    let cancelled = false;
    apiFetch<EquipmentListResponse>(`/api/equipment?${query}`)
      .then((data) => !cancelled && setResult({ key: queryKey, data }))
      .catch((err) => !cancelled && setResult({ key: queryKey, error: err.message ?? 'Equipment could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [query, queryKey]);
 
  // the notice disappears by itself after a few seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);
 
  const loading = result?.key !== queryKey;
  const data = result?.data ?? null; // keeps showing the previous page while the next one loads
  const error = loading ? '' : (result?.error ?? '');
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const first = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const last = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0;
 
  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
 
  function changeAvailability(value: boolean) {
    setOnlyAvailable(value);
    setPage(1);
  }
 
  function handleSaved(message: string) {
    setModal({ mode: 'closed' });
    setNotice(message);
    setReloadCount((n) => n + 1);
  }
 
  async function handleDelete(item: Equipment) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setBusyId(item.equipmentId);
    try {
      // a successful DELETE answers 204 with no body; a blocked one (still used somewhere) answers 409 with a message
      await apiFetch<null>(`/api/equipment/${item.equipmentId}`, { method: 'DELETE' });
      setNotice(`${item.name} was deleted`);
      if (data && data.items.length === 1 && page > 1) setPage(page - 1); 
      else setReloadCount((n) => n + 1);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'The equipment could not be deleted');
    } finally {
      setBusyId(null);
    }
  }
 
  const nameBlock = (item: Equipment) => (
    <div className="flex min-w-0 items-center gap-4">
      <EquipmentPhoto src={item.imageUrl} name={item.name} size="md" />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium">{item.name}</p>
        {item.description && <p className={`mt-0.5 line-clamp-2 text-xs ${ui.muted}`}>{item.description}</p>}
      </div>
    </div>
  );
 
  const actions = (item: Equipment) =>
    canManage && (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setModal({ mode: 'edit', item })}
          className={`${ui.btnText} h-9 gap-1.5 px-3`}
          aria-label={`Edit ${item.name}`}
        >
          <EditIcon width={18} height={18} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleDelete(item)}
          disabled={busyId === item.equipmentId}
          className={`${ui.btnDanger} gap-1.5`}
          aria-label={`Delete ${item.name}`}
        >
          <DeleteIcon width={18} height={18} />
          Delete
        </button>
      </div>
    );
 
  return (
    <div>
      <PageHeading
        title="Equipment"
        subtitle="Everything the lab can lend out, with a photo, where to find it and how many are free right now."
        action={
          canManage && (
            <button type="button" onClick={() => setModal({ mode: 'add' })} className={`${ui.btnPrimary} gap-2 pr-6 pl-5`}>
              <PlusIcon />
              Add equipment
            </button>
          )
        }
      />
 
      <div className={`overflow-hidden ${ui.card}`}>
        {/* Filters */}
        <div className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center ${ui.border}`}>
          <label className="relative block sm:flex-1">
            <span className="sr-only">Search equipment</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
            <input
              type="search"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search by name"
              className="h-11 w-full rounded-full bg-[#f1f3f4] pr-4 pl-11 text-[15px] outline-none placeholder:text-[#5f6368] focus:bg-white focus:ring-2 focus:ring-[#1558b0] dark:bg-[#303134] dark:placeholder:text-[#9aa0a6] dark:focus:ring-[#a8c7fa]"
            />
          </label>
          <select
            value={onlyAvailable ? 'available' : 'all'}
            onChange={(e) => changeAvailability(e.target.value === 'available')}
            className={`${ui.select} sm:w-48`}
            aria-label="Filter by availability"
          >
            <option value="all">All equipment</option>
            <option value="available">Available now</option>
          </select>
        </div>
 
        {error && (
          <p role="alert" className="m-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
            {error}
          </p>
        )}
 
        {/* Phones: one card per item */}
        <ul className={`md:hidden ${loading ? 'opacity-60' : ''}`}>
          {data?.items.map((item) => (
            <li key={item.equipmentId} className={`border-b px-4 py-4 last:border-b-0 ${ui.border}`}>
              {nameBlock(item)}
              <div className="mt-3 space-y-1.5 text-sm">
                <StockBadge item={item} />
                <p className={ui.muted}>{item.location || 'No location set'}</p>
              </div>
              {canManage && <div className="mt-2 -ml-3">{actions(item)}</div>}
            </li>
          ))}
        </ul>
 
        {/* Tablets and up: a table */}
        <table className="hidden w-full table-auto text-left text-sm md:table">
          <thead className={ui.muted}>
            <tr className={`border-b ${ui.border}`}>
              <th className="px-4 py-3 font-medium">Equipment</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Location</th>
              <th className="px-4 py-3 font-medium">Availability</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-60' : ''}>
            {data?.items.map((item) => (
              <tr key={item.equipmentId} className={`border-b last:border-b-0 ${ui.border} hover:bg-[#f8f9fa] dark:hover:bg-[#28292a]`}>
                <td className="w-full max-w-0 px-4 py-3">
                  {nameBlock(item)}
                  <p className={`mt-1 pl-20 text-xs lg:hidden ${ui.muted}`}>{item.location || 'No location set'}</p>
                </td>
                <td className={`hidden px-4 py-3 lg:table-cell ${ui.muted}`}>
                  <span className="block max-w-[13rem] truncate" title={item.location ?? undefined}>
                    {item.location || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StockBadge item={item} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{actions(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
 
        {data && data.items.length === 0 && (
          <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>
            {q || onlyAvailable
              ? 'No equipment matches your search. Try a different name or clear the filter.'
              : canManage
                ? 'No equipment yet. Use "Add equipment" to add the first one.'
                : 'No equipment has been added yet.'}
          </p>
        )}
        {!data && loading && <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>Loading equipment…</p>}
 
        {data && data.total > 0 && (
          <div className={`flex items-center justify-end gap-2 border-t px-4 py-2 text-sm ${ui.border} ${ui.muted}`}>
            <span className="mr-2">
              {first}–{last} of {data.total}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              className={`rounded-full p-2 disabled:opacity-40 ${ui.hover} ${ui.focus}`}
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label="Next page"
              className={`rounded-full p-2 disabled:opacity-40 ${ui.hover} ${ui.focus}`}
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>
 
      {canManage && modal.mode !== 'closed' && (
        <EquipmentModal
          // a new key makes React start a fresh form when you open a different item
          key={modal.mode === 'edit' ? `edit-${modal.item.equipmentId}` : 'add'}
          item={modal.mode === 'edit' ? modal.item : null}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={handleSaved}
        />
      )}
 
      {/* Snackbar */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded bg-[#313131] py-3.5 pr-2 pl-4 text-sm text-[#f2f2f2] shadow-lg sm:left-6 sm:translate-x-0 dark:bg-[#e3e3e3] dark:text-[#313131]"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="rounded px-3 py-1.5 font-medium text-[#a8c7fa] hover:bg-white/10 dark:text-[#1558b0] dark:hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}