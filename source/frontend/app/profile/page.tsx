// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type User = {
  userId: number;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => setError('Could not reach the server'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;
  if (error) return <p style={{ padding: 32, color: 'red' }}>{error}</p>;
  if (!user) return null; // already redirecting to /login

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h1>My Profile</h1>
      <p><strong>User ID:</strong> {user.userId}</p>
      <p><strong>Role:</strong> {user.role}</p>

      <button
        onClick={async () => {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
          router.push('/login');
        }}
      >
        Log out
      </button>
    </div>
  );
}