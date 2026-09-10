// app/profile/page.tsx
'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ProfilePage() {
  
  // Checking if user is login or have cookie token
  const { user, loading, error } = useRequireAuth();

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;
  if (error) return <p style={{ padding: 32, color: 'red' }}>{error}</p>;
  if (!user) return null; // already redirecting to /login

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h1>My Profile</h1>
      <p><strong>User ID:</strong> {user.userId}</p>
      <p><strong>Role:</strong> {user.role}</p>
    </div>
  );
}