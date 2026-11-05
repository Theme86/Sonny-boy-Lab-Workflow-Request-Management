// components/dashboard/EmptyArt.tsx — small drawings for empty cards, on the same scope graticule as the login picture.
// Kept physically honest: a flat trace means "no signal", a damped wave keeps one period while it decays.
import type { ReactNode } from 'react';

export type ArtKind = 'flat' | 'damped' | 'search';

const W = 72;
const H = 44;

// a damped sine, x 4..68, amplitude 13 → 0, period 16
const DAMPED = Array.from({ length: 65 }, (_, i) => {
  const y = 22 - 13 * Math.exp(-i / 18) * Math.sin((i / 16) * 2 * Math.PI);
  return `${i === 0 ? 'M' : 'L'}${(4 + i).toFixed(0)} ${y.toFixed(2)}`;
}).join(' ');

const TRACES: Record<ArtKind, ReactNode> = {
  flat: <path d={`M4 22 H${W - 4}`} />,
  damped: <path d={DAMPED} />,
  search: (
    <>
      <circle cx={32} cy={20} r={10} />
      <path d="M39.5 27.5 L48 36" />
    </>
  ),
};

function Graticule() {
  return (
    <g className="stroke-[#80868b]" strokeWidth={0.6} opacity={0.35}>
      {[18, 36, 54].map((x) => (
        <path key={x} d={`M${x} 2 V${H - 2}`} />
      ))}
      {[11, 22, 33].map((y) => (
        <path key={y} d={`M2 ${y} H${W - 2}`} />
      ))}
    </g>
  );
}

export function EmptyArt({ kind }: { kind: ArtKind }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden focusable="false" className="shrink-0">
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={6} className="fill-[#1558b0]/[0.04] stroke-[#80868b]/40 dark:fill-[#a8c7fa]/[0.05]" />
      <Graticule />
      <g fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="stroke-[#1558b0] dark:stroke-[#a8c7fa]">
        {TRACES[kind]}
      </g>
    </svg>
  );
}
