// app/test/page.tsx
'use client';

import { useState } from 'react';


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserPage() {

  const [health, setHealth] = useState<string>('');
  const [userId, setUserId] = useState('');
  const [userResult, setUserResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function checkHealth() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/health`, {
        credentials: 'include',
      });
      const data = await res.json();
      setHealth(JSON.stringify(data));
    } catch (err) {
      setHealth(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setUserResult(`${res.status}: ${JSON.stringify(data)}`);
    } catch (err) {
      setUserResult(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h1>Backend Connection Test</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Health Check</h2>
        <button onClick={checkHealth} disabled={loading}>
          Ping /health
        </button>
        <pre>{health}</pre>
      </section>

      <section>
        <h2>Get User by ID</h2>
        <input
          type="number"
          placeholder="user id"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={fetchUser} disabled={loading || !userId}>
          Fetch User
        </button>
        <pre>{userResult}</pre>
      </section>
    </div>
  );
}