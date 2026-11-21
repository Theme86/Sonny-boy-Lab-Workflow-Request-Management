// app/page.tsx — the public landing page: a full-screen dark hero over a live WebGL fluid
// (lib/fluidSimulation.js) that bursts into colour on load and keeps swirling; the mouse stirs it too.
// The text staggers in, the heading and sub-line word by word. Under the hero, an overview of what the
// app has and does (components/landing/LandingOverview.tsx). Styles: app/landing.css.
// Sends visitors to the login page, or straight to the dashboard when they are already signed in.
'use client';

import './landing.css';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { VaseMark } from '@/components/icons';
import { LandingOverview } from '@/components/landing/LandingOverview';
import { apiFetch } from '@/lib/api';
import { fluidSimulation } from '@/lib/fluidSimulation';
import { fontVariables, landingFontVariable } from '@/lib/fonts';
import { displayFamily } from '@/lib/fontStacks';

const HEADING = 'Every Lab Request, Tracked to Done';
const SUB_LINE = 'Book equipment, report problems and order supplies in one place, instead of email threads and spreadsheets.';

const NAV_LINKS = [
  { href: '/requests', label: 'Requests' },
  { href: '/equipment', label: 'Equipment' },
  { href: '/labsessions', label: 'Lab sessions' },
  { href: '/consumables', label: 'Consumables' },
] as const;

// entrance delays after load, in ms
const DELAY = { nav: 150, badge: 320, heading: 480, sub: 1150, bar: 1450, footer: 1650 };

type Vars = CSSProperties & Record<`--${string}`, string>;

const block = (delay: number, from = '1.25rem'): Vars => ({ '--lp-delay': `${delay}ms`, '--lp-from': from });

/** Splits text into words that fade and rise in one after another. */
function Words({ text, delay, stagger, duration, from }: { text: string; delay: number; stagger: number; duration: number; from: string }) {
  const words = text.split(' ');
  return words.map((word, i) => (
    <span key={i}>
      <span
        className="lp-word"
        style={{ '--lp-delay': `${delay + i * stagger}ms`, '--lp-dur': `${duration}ms`, '--lp-from': from } as Vars}
      >
        {word}
      </span>
      {i < words.length - 1 && ' '}
    </span>
  ));
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // null while we ask the server, so the buttons don't flash the wrong label
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [shown, setShown] = useState(false);

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

  // the fluid: skipped for people who ask for reduced motion; without WebGL the dark base shows instead
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;
    let stop: (() => void) | undefined;
    try {
      stop = fluidSimulation(canvas);
    } catch {
      stop = undefined;
    }
    return () => stop?.();
  }, []);

  const href = signedIn ? '/dashboard' : '/login';

  return (
    <div className={`lp-page ${fontVariables} ${landingFontVariable}`} style={{ '--lp-font': displayFamily } as Vars}>
    <section className={`lp-hero ${shown ? 'lp-shown' : ''}`}>
      <canvas ref={canvasRef} className="lp-canvas" aria-hidden="true" />
      <div className="lp-scrim" aria-hidden="true" />

      <header className="lp-nav lp-reveal" style={block(DELAY.nav, '-0.75rem')}>
        <Link href="/" className="lp-brand">
          <VaseMark />
          Vase Lab
        </Link>
        <nav aria-label="Main" className="lp-links">
          {NAV_LINKS.map(({ href: to, label }) => (
            <Link key={to} href={to}>
              {label}
            </Link>
          ))}
        </nav>
        <span className="lp-cta-slot" aria-live="polite">
          {signedIn === null ? (
            <span className="sr-only">Checking access…</span>
          ) : (
            <Link href={href} className="lp-pill">
              {signedIn ? 'Go to dashboard' : 'Sign in'}
            </Link>
          )}
        </span>
      </header>

      <div className="lp-column">
        <p className="lp-badge lp-reveal" style={block(DELAY.badge)}>
          Physics lab · Request management
        </p>
        <h1 className="lp-heading">
          <Words text={HEADING} delay={DELAY.heading} stagger={85} duration={720} from="26px" />
        </h1>
        <p className="lp-sub">
          <Words text={SUB_LINE} delay={DELAY.sub} stagger={22} duration={600} from="14px" />
        </p>
        <div className="lp-bar-wrap lp-reveal" style={block(DELAY.bar)}>
          <div className="lp-bar">
            <p className="lp-bar-text">
              {signedIn ? 'You are signed in.' : 'Sign in with your university Google account.'}
            </p>
            {signedIn !== null && (
              <Link href={href} className="lp-pill">
                {signedIn ? 'Go to dashboard' : 'Sign in with Google'}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="lp-footer lp-reveal" style={block(DELAY.footer)}>
        <a href="#features" className="lp-scroll">
          See what’s inside <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>

    <main>
      <LandingOverview />
    </main>

    <footer className="lp-page-footer">
      <p>© 2026 Vase Lab — lab workflow &amp; request management.</p>
    </footer>
    </div>
  );
}
