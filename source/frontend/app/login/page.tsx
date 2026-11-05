// app/login/page.tsx — sign in with Google. The first sign-in also creates the account:
// everyone starts as a Lab Member and is then sent to "Create profile" (see AppShell).
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { VaseMark } from '@/components/icons';
import { LoginIllustration } from '@/components/LoginIllustration';
import { ThemeToggle } from '@/components/ThemeToggle';
import { apiFetch } from '@/lib/api';
import { fontStyle, fontVariables } from '@/lib/fonts';
import { buttonWidth, loadGoogleScript, renderGoogleButton } from '@/lib/googleSignIn';
import { useTheme } from '@/lib/theme';
import { ui } from '@/lib/ui';

// soft square grid behind the page, drawn with two gradients so it needs no image
const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(to right, rgb(128 134 139 / .14) 1px, transparent 1px), linear-gradient(to bottom, rgb(128 134 139 / .14) 1px, transparent 1px)',
  backgroundSize: '96px 96px',
  backgroundPosition: 'center top',
};

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  // already signed in? skip the login screen
  useEffect(() => {
    apiFetch('/auth/me')
      .then(() => router.replace('/dashboard'))
      .catch(() => {});
  }, [router]);

  // (re)draw Google's button; again when the theme changes so it matches
  useEffect(() => {
    let cancelled = false;

    async function signIn(idToken: string) {
      setError('');
      try {
        await apiFetch('/auth/google', { method: 'POST', json: { idToken } });
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    }

    loadGoogleScript()
      .then((google) => {
        const element = buttonRef.current;
        if (cancelled || !element) return;
        const width = buttonWidth(element.parentElement?.clientWidth ?? 320);
        renderGoogleButton(google, element, { dark: theme === 'dark', width, onCredential: signIn });
      })
      .catch(() => !cancelled && setUnavailable(true));

    return () => {
      cancelled = true;
    };
  }, [router, theme]);

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden ${ui.page} ${fontVariables}`} style={{ ...fontStyle, ...GRID_STYLE }}>
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className={`flex items-center gap-2 rounded ${ui.focus}`}>
          <VaseMark width={26} height={26} className="text-[#1558b0] dark:text-[#a8c7fa]" />
          <span className="text-[22px] leading-none text-[#444746] dark:text-[#e3e3e3]">Vase Lab</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
        <LoginIllustration />
        <h1 className="mt-6 text-center font-serif text-[32px] leading-tight sm:text-[36px]">Welcome to Vase Lab</h1>
        <p className={`mt-2 text-center text-[15px] ${ui.muted}`}>Sign in with your Google account to continue.</p>

        <div className={`mt-8 w-full max-w-[360px] p-5 ${ui.card}`}>
          <div className="flex min-h-11 justify-center">
            <div ref={buttonRef} aria-label="Sign in with Google" />
          </div>

          {unavailable && (
            <p role="alert" className={`mt-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]`}>
              Google sign-in could not be loaded. Check your connection and refresh the page.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
              {error}
            </p>
          )}
        </div>

        <p className={`mt-4 max-w-[360px] text-center text-xs ${ui.muted}`}>
          First time here? Signing in creates your account, and you will be asked for your name next.
        </p>
        <Link href="/" className={`${ui.btnText} mt-2`}>
          Back to home
        </Link>
      </main>
    </div>
  );
}
