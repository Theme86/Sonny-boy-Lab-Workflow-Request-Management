// app/equipment/page.tsx
'use client';
 
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEffect, useState, FormEvent } from 'react';
 
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 20;
 
type Equipment = {
  equipmentId: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  category: { categoryId: number; name: string } | null;
  quantityTotal: number;
  quantityAvailable: number;
  location: string | null;
};
 
type ListResponse = {
  items: Equipment[];
  page: number;
  limit: number;
  total: number;
};
 
export default function EquipmentPage() {
  const { user, loading, error } = useRequireAuth();
 
  const [items, setItems] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fetchError, setFetchError] = useState<string | null>(null);
 
  // search / filter
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
 
  // form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantityTotal, setQuantityTotal] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
 
  // must match canManage in equipmentRoutes.js (backend is the real protection)
  const canManage = user?.role === 'lab_manager';
 
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
 
  async function fetchEquipment(targetPage = page) {
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (onlyAvailable) params.set('available', 'true');
 
      const res = await fetch(`${API_URL}/api/equipment?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to load (status ${res.status})`);
 
      const data: ListResponse = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setFetchError(null); // clear any old error after a success
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }
 
  useEffect(() => {
    if (!user) return;
    fetchEquipment(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);
 
  function handleSearch() {
    if (page === 1) fetchEquipment(1);
    else setPage(1); // the effect above reloads
  }
 
  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setLocation('');
    setCategoryId('');
    setQuantityTotal('');
    setQuantityAvailable('');
    setSubmitError(null);
  }
 
  function startEdit(item: Equipment) {
    setEditingId(item.equipmentId);
    setName(item.name);
    setDescription(item.description ?? '');
    setLocation(item.location ?? '');
    setCategoryId(item.categoryId !== null ? String(item.categoryId) : '');
    setQuantityTotal(String(item.quantityTotal));
    setQuantityAvailable(String(item.quantityAvailable));
    setSubmitError(null);
  }
 
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
 
    const isEditing = editingId !== null;
    const total = Number(quantityTotal) || 0;
 
    // same rule as the backend: available cannot exceed total
    if (quantityAvailable !== '' && Number(quantityAvailable) > total) {
      setSubmitError('Available cannot be greater than total');
      return;
    }
 
    const body: Record<string, unknown> = {
      name,
      description: description || null,
      location: location || null,
      categoryId: categoryId ? Number(categoryId) : null,
      quantityTotal: total,
    };
    // on create, leaving "available" empty makes the backend use the total
    if (quantityAvailable !== '') body.quantityAvailable = Number(quantityAvailable);
 
    try {
      const res = await fetch(
        isEditing ? `${API_URL}/api/equipment/${editingId}` : `${API_URL}/api/equipment`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
 
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Request failed (status ${res.status})`);
      }
 
      resetForm();
      fetchEquipment();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }
 
  async function handleDelete(id: number) {
    if (!window.confirm('Delete this equipment?')) return;
 
    try {
      const res = await fetch(`${API_URL}/api/equipment/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
 
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => null);
        // 409 = still used by a session / request / reservation
        throw new Error(err?.error ?? `Delete failed (status ${res.status})`);
      }
 
      if (editingId === id) resetForm();
      // if we just deleted the last row on this page, go back one page
      if (items.length === 1 && page > 1) setPage(page - 1);
      else fetchEquipment();
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }
 
  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;
  if (error) return <p style={{ padding: 32, color: 'red' }}>{error}</p>;
  if (!user) return null;
 
  const cellStyle = { padding: '8px 16px', textAlign: 'left' as const };
 
  return (
    <div style={{ padding: 32 }}>
      <h1>Equipment</h1>
 
      <div style={{ margin: '16px 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <label>
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />{' '}
          Only available
        </label>
        <button type="button" onClick={handleSearch}>Search</button>
      </div>
 
      {fetchError && <p style={{ color: 'red' }}>{fetchError}</p>}
 
      {canManage && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} required />
          <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={250} />
          <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} />
          <input placeholder="Category ID" type="number" min={1} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
          <input placeholder="Total" type="number" min={0} value={quantityTotal} onChange={(e) => setQuantityTotal(e.target.value)} />
          <input placeholder="Available" type="number" min={0} value={quantityAvailable} onChange={(e) => setQuantityAvailable(e.target.value)} />
          <button type="submit">{editingId !== null ? 'Save' : 'Add'}</button>
          {editingId !== null && <button type="button" onClick={resetForm}>Cancel</button>}
          {submitError && <p style={{ color: 'red', width: '100%' }}>{submitError}</p>}
        </form>
      )}
 
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Category</th>
            <th style={cellStyle}>Location</th>
            <th style={cellStyle}>Available / Total</th>
            {canManage && <th style={cellStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td style={cellStyle} colSpan={canManage ? 5 : 4}>No equipment found.</td>
            </tr>
          )}
          {items.map((item) => (
            <tr
              key={item.equipmentId}
              // red only when something exists in the lab but none is free right now
              style={{ color: item.quantityTotal > 0 && item.quantityAvailable === 0 ? 'red' : 'inherit' }}
            >
              <td style={cellStyle}>
                {item.name}
                {item.description && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{item.description}</div>
                )}
              </td>
              <td style={cellStyle}>{item.category?.name ?? '-'}</td>
              <td style={cellStyle}>{item.location ?? '-'}</td>
              <td style={cellStyle}>{item.quantityAvailable} / {item.quantityTotal}</td>
              {canManage && (
                <td style={cellStyle}>
                  <button type="button" onClick={() => startEdit(item)}>Edit</button>{' '}
                  <button type="button" onClick={() => handleDelete(item.equipmentId)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
 
      <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}>Prev</button>
        <span>Page {page} of {totalPages} ({total} items)</span>
        <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</button>
      </div>
    </div>
  );
}