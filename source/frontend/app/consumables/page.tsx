'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEffect, useState, FormEvent } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Consumable = {
  consumableId: number;
  name: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  expiryDate: string | null;
};

export default function ConsumablesPage() {
  const { user, loading, error } = useRequireAuth();
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [reorderThreshold, setReorderThreshold] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canManage = user?.role === 'lab_manager' || user?.role === 'lecturer';

  const fetchConsumables = async () => {
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`${API_URL}/api/consumables${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to load (status ${res.status})`);
      const data = await res.json();
      setConsumables(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchConsumables();
  }, [user]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setUnit('');
    setCurrentStock('');
    setReorderThreshold('');
    setSubmitError(null);
  }

  function startEdit(item: Consumable) {
    setEditingId(item.consumableId);
    setName(item.name);
    setUnit(item.unit);
    setCurrentStock(String(item.currentStock));
    setReorderThreshold(String(item.reorderThreshold));
    setSubmitError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const isEditing = editingId !== null;
    const url = isEditing
      ? `${API_URL}/api/consumables/${editingId}`
      : `${API_URL}/api/consumables`;

    try {
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          unit,
          currentStock: Number(currentStock) || 0,
          reorderThreshold: Number(reorderThreshold) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `Request failed (status ${res.status})`);
      }

      resetForm();
      fetchConsumables();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Delete this consumable?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/consumables/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.error ?? `Delete failed (status ${res.status})`);
      }

      if (editingId === id) resetForm();
      fetchConsumables();
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
          <input
      placeholder="Search by name"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <button onClick={fetchConsumables}>Search</button>

      <h1>Consumables</h1>
      {fetchError && <p style={{ color: 'red' }}>{fetchError}</p>}

      {canManage && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Unit (e.g. ml, g)" value={unit} onChange={(e) => setUnit(e.target.value)} required />
          <input placeholder="Current Stock" type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} />
          <input placeholder="Reorder Threshold" type="number" value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} />
          <button type="submit">{editingId !== null ? 'Save' : 'Add'}</button>
          {editingId !== null && (
            <button type="button" onClick={resetForm}>Cancel</button>
          )}
          {submitError && <p style={{ color: 'red', width: '100%' }}>{submitError}</p>}
        </form>
      )}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Unit</th>
            <th style={cellStyle}>Current Stock</th>
            <th style={cellStyle}>Reorder Threshold</th>
            <th style={cellStyle}>Expiry Date</th>
            {canManage && <th style={cellStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {consumables.map((item) => {
            const isLow = item.currentStock <= item.reorderThreshold;
            return (
              <tr key={item.consumableId} style={{ color: isLow ? 'red' : 'inherit' }}>
                <td style={cellStyle}>{item.name}</td>
                <td style={cellStyle}>{item.unit}</td>
                <td style={cellStyle}>{item.currentStock}</td>
                <td style={cellStyle}>{item.reorderThreshold}</td>
                <td style={cellStyle}>{item.expiryDate ?? '-'}</td>
                {canManage && (
                  <td style={cellStyle}>
                    <button type="button" onClick={() => startEdit(item)}>Edit</button>
                    {' '}
                    <button type="button" onClick={() => handleDelete(item.consumableId)}>Delete</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
