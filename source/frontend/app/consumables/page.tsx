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

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [reorderThreshold, setReorderThreshold] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canManage = user?.role === 'lab_manager' || user?.role === 'lecturer';

  const fetchConsumables = async () => {
    try {
      const res = await fetch(`${API_URL}/api/consumables`, {
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

  async function handleAddConsumable(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    try {
      const res = await fetch(`${API_URL}/api/consumables`, {
        method: 'POST',
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
        throw new Error(err.error ?? `Failed to add (status ${res.status})`);
      }

      setName('');
      setUnit('');
      setCurrentStock('');
      setReorderThreshold('');
      fetchConsumables();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;
  if (error) return <p style={{ padding: 32, color: 'red' }}>{error}</p>;
  if (!user) return null;

  const cellStyle = { padding: '8px 16px', textAlign: 'left' as const };

  return (
    <div style={{ padding: 32 }}>
      <h1>Consumables</h1>
      {fetchError && <p style={{ color: 'red' }}>{fetchError}</p>}

      {canManage && (
        <form onSubmit={handleAddConsumable} style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Unit (e.g. ml, g)" value={unit} onChange={(e) => setUnit(e.target.value)} required />
          <input placeholder="Current Stock" type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} />
          <input placeholder="Reorder Threshold" type="number" value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} />
          <button type="submit">Add</button>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
