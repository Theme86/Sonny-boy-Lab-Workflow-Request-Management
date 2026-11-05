// components/dashboard/Readout.tsx — one number with a label, like a reading on an instrument display.
import Link from 'next/link';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';
import { TONE_TEXT, type Tone } from './tones';

interface ReadoutProps {
  value: number | string;
  label: string;
  tone?: Tone;
  href?: string;
}

export function Readout({ value, label, tone = 'neutral', href }: ReadoutProps) {
  const body = (
    <>
      <span className={`block text-[32px] leading-none font-medium tabular-nums ${TONE_TEXT[tone]}`} style={{ fontFamily: monoFamily }}>
        {value}
      </span>
      <span className={`mt-2 block text-sm ${ui.muted}`}>{label}</span>
    </>
  );
  if (!href) return <div>{body}</div>;
  return (
    <Link href={href} className={`block rounded-lg ${ui.focus}`}>
      {body}
    </Link>
  );
}
