// app/profile/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ProfilePage() {
  const router = useRouter();

  // Checking if user is login or have cookie token
  const { user, loading, error } = useRequireAuth();

  async function handleLogout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  }

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;
  if (error) return <p style={{ padding: 32, color: 'red' }}>{error}</p>;
  if (!user) return null; // already redirecting to /login

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h1>My Profile</h1>
      <p><strong>User ID:</strong> {user.userId}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <button type="button" onClick={handleLogout}>Log out</button>
    </div>
  );
}