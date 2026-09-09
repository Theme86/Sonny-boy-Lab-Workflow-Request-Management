// app/login/page.tsx
'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    console.log('CLIENT ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
      });
    };
    document.body.appendChild(script);
  }, []);

  async function handleCredentialResponse(response: { credential: string }) {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential }),
    });

    if (res.ok) {
      router.push('/dashboard'); // wherever your app lands post-login
    } else {
      const err = await res.json();
      console.error('Login failed:', err);
    }
  }

  useEffect(() => {
    console.log('CLIENT ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1>Sign in</h1>
      <div ref={buttonRef} />
    </div>
  );
}