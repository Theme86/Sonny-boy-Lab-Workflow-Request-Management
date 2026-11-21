// app/page.tsx — the public landing page. Same header, fonts, colours and buttons as the login page,
// and it follows the same light/dark switch. The hero sits over a live WebGL fluid
// (lib/fluidSimulation.js) tinted to the theme; under it, a plain overview of what the app does
// (components/landing/LandingOverview.tsx). Sends visitors to /login, or to /dashboard when signed in.
'use client';

import './landing.css';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { VaseMark } from '@/components/icons';
import { LabInfoFooter } from '@/components/LabInfoFooter';
import { LandingOverview } from '@/components/landing/LandingOverview';
import { ThemeToggle } from '@/components/ThemeToggle';
import { apiFetch } from '@/lib/api';
import { fluidSimulation } from '@/lib/fluidSimulation';
import { fontStyle, fontVariables } from '@/lib/fonts';
import { useTheme, type Theme } from '@/lib/theme';
import { ui } from '@/lib/ui';

const BRAND = 'Vase Lab';

// The fluid per theme. Dark: violet ink on the dark canvas colour (#14111c).
// Light: the canvas is inverted in CSS, so the base is the inverse of #e9eff8 and the hues are the
// complements of the blues we want to see.
const FLUID: Record<Theme, { back: { r: number; g: number; b: number }; hues: [number, number] }> = {
  dark: { back: { r: 20, g: 17, b: 28 }, hues: [0.58, 0.24] },
  light: { back: { r: 22, g: 16, b: 7 }, hues: [0.03, 0.14] },
};

const DELAY = { heading: 150, tagline: 650, text: 800, actions: 1000 };

type Vars = CSSProperties & Record<`--${string}`, string>;

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Home() {
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // null while we ask the server, so the buttons don't flash the wrong label
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    apiFetch('/auth/me')
      .then(() => setSignedIn(true))
      .catch(() => setSignedIn(false));
  }, []);

  // start the entrance on the frame after the first paint, so the transitions run
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // the fluid: skipped for people who ask for reduced motion; without WebGL the plain canvas colour shows
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;
    let stop: (() => void) | undefined;
    try {
      stop = fluidSimulation(canvas, {
        backColor: () => FLUID[themeRef.current].back,
        hueBand: () => FLUID[themeRef.current].hues,
      });
    } catch {
      stop = undefined;
    }
    return () => stop?.();
  }, []);

  const href = signedIn ? '/dashboard' : '/login';
  // letters animate in one by one; each word stays together so a narrow screen wraps between words
  const brandWords = BRAND.split(' ').map((word, w, all) => ({
    word,
    offset: all.slice(0, w).join(' ').length + (w ? 1 : 0),
  }));

  return (
    <div className={`flex min-h-screen flex-col ${ui.page} ${fontVariables}`} style={fontStyle}>
      <header className="relative z-10 flex h-16 items-center justify-between gap-4 border-b border-vl-line px-4 sm:px-8">
        <Link href="/" className={`flex items-center gap-2 rounded ${ui.focus}`}>
          <VaseMark width={26} height={26} className="text-vl-accent" />
          <span className="text-[22px] leading-none text-vl-ink-soft dark:text-vl-ink">Vase Lab</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="inline-flex min-w-[88px] justify-end" aria-live="polite">
            {signedIn === null ? (
              <span className="sr-only">Checking access…</span>
            ) : (
              <Link href={href} className={ui.btnPrimary}>
                {signedIn ? 'Go to dashboard' : 'Sign in'}
              </Link>
            )}
          </span>
        </div>
      </header>

      <section className={`lp-hero flex items-center justify-center px-4 py-20 text-center ${shown ? 'lp-shown' : ''}`}>
        <canvas ref={canvasRef} className="lp-canvas" aria-hidden="true" />
        <div className="lp-scrim" aria-hidden="true" />

        <div className="flex max-w-[760px] flex-col items-center">
          <h1 className="font-serif text-[72px] leading-none tracking-[-0.02em] uppercase sm:text-[120px]">
            <span className="sr-only">{BRAND}</span>
            <span aria-hidden="true">
              {brandWords.map(({ word, offset }, w) => (
                <span key={w} className="inline-block whitespace-nowrap">
                  {word.split('').map((letter, i) => (
                    <span
                      key={i}
                      className="lp-word"
                      style={{ '--lp-delay': `${DELAY.heading + (offset + i) * 60}ms`, '--lp-dur': '700ms', '--lp-from': '28px' } as Vars}
                    >
                      {letter}
                    </span>
                  ))}
                  {w < brandWords.length - 1 && ' '}
                </span>
              ))}
            </span>
          </h1>
          <p
            className="lp-reveal mt-5 font-serif text-[24px] leading-snug text-vl-ink sm:text-[30px]"
            style={{ '--lp-delay': `${DELAY.tagline}ms` } as Vars}
          >
            Requests, bookings and stock
          </p>
          <p
            className="lp-reveal mt-4 max-w-[560px] text-[17px] leading-relaxed text-vl-ink-soft"
            style={{ '--lp-delay': `${DELAY.text}ms` } as Vars}
          >
            Report a broken instrument, book a room, check how much ethanol is left, and see who is looking after your request.
            Vase Lab keeps it all in one place for Aj. Milk’s lab.
          </p>
          <div className="lp-reveal mt-8 flex flex-col items-center gap-3" style={{ '--lp-delay': `${DELAY.actions}ms` } as Vars}>
            <div className="flex min-h-11 flex-wrap justify-center gap-3">
              {signedIn !== null && (
                <Link href={href} className={`${ui.btnPrimary} h-11 px-5`}>
                  {signedIn ? 'Go to dashboard' : 'Sign in with Google'}
                </Link>
              )}
              <a href="#what-you-can-do" className={`${ui.btnOutline} h-11 px-5`}>
                What you can do here
              </a>
            </div>
            {signedIn === false && (
              <p className={`text-sm ${ui.muted}`}>First time here? Signing in creates your account.</p>
            )}
          </div>
        </div>
      </section>

      <main className="border-t border-vl-line bg-vl-surface-2/60">
        <LandingOverview />
      </main>

      <footer className={`flex flex-col items-center border-t border-vl-line px-4 pt-2 pb-8 text-xs ${ui.muted}`}>
        <LabInfoFooter />
        <p className="mt-4">Vase Lab · Lab Workflow &amp; Request Management</p>
      </footer>
    </div>
  );
}
