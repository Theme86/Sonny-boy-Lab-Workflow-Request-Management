// app/login/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState('');

  // already logged in? skip the login screen
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (res.ok) router.replace('/sessions');
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    async function handleCredentialResponse(response: { credential: string }) {
      setError('');
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential }),
        });

        if (res.ok) {
          router.push('/sessions');
        } else {
          const err = await res.json().catch(() => null);
          setError(err?.error ?? 'Login failed');
        }
      } catch {
        setError('Could not reach the server');
      }
    }

    function initGoogle() {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
      });
    }

    // script already loaded (e.g. coming back to /login) -> just init
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initGoogle;
    document.body.appendChild(script);

    // remove the script on unmount so dev double-mounts don't add it twice
    return () => {
      script.remove();
    };
  }, [router]);

  return (
    <div style={{ padding: 32 }}>
      <h1>Sign in</h1>
      <div ref={buttonRef} />
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}
