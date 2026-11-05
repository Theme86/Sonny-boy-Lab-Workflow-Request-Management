// components/LoginIllustration.tsx — the picture above the sign-in card: an oscilloscope screen
// in an arch, showing a slowly travelling sine wave, with a few measured data points around it.
// Purely decorative (hidden from screen readers); the wave stands still for people who ask for reduced motion.

// screen area inside the arch (viewBox units)
const SCREEN = { left: 27, right: 133, top: 17, bottom: 133 };
const MID_Y = 78;
const WAVELENGTH = 53; // two full waves across the screen
const AMPLITUDE = 20;

/** A sine path two screens wide, so shifting it by one wavelength loops without a jump. */
function sinePath() {
  const points: string[] = [];
  for (let x = SCREEN.left - WAVELENGTH; x <= SCREEN.right + WAVELENGTH; x += 2) {
    const y = MID_Y - AMPLITUDE * Math.sin(((x - SCREEN.left) / WAVELENGTH) * 2 * Math.PI);
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}
const TRACE = sinePath();

// graticule: 10 divisions across, 8 down, like a real scope
const COLS = Array.from({ length: 9 }, (_, i) => SCREEN.left + ((i + 1) * (SCREEN.right - SCREEN.left)) / 10);
const ROWS = Array.from({ length: 7 }, (_, i) => SCREEN.top + ((i + 1) * (SCREEN.bottom - SCREEN.top)) / 8);

/** A measured value with its error bar. */
function DataPoint({ x, y, err, className }: { x: number; y: number; err: number; className: string }) {
  return (
    <g className={className} strokeWidth={1.4} strokeLinecap="round">
      <line x1={x} y1={y - err} x2={x} y2={y + err} stroke="currentColor" />
      <line x1={x - 2.5} y1={y - err} x2={x + 2.5} y2={y - err} stroke="currentColor" />
      <line x1={x - 2.5} y1={y + err} x2={x + 2.5} y2={y + err} stroke="currentColor" />
      <circle cx={x} cy={y} r={2.6} fill="currentColor" />
    </g>
  );
}

export function LoginIllustration() {
  return (
    <svg viewBox="0 0 160 152" width={176} height={167} className="mx-auto overflow-visible" aria-hidden focusable="false">
      <style>{`
        @keyframes scope-drift { to { transform: translateX(-${WAVELENGTH}px); } }
        @media (prefers-reduced-motion: no-preference) {
          .scope-trace { animation: scope-drift 5s linear infinite; }
        }
      `}</style>
      <defs>
        <clipPath id="scope-screen">
          <path d="M27 133 V70 A53 53 0 0 1 133 70 V133 Z" />
        </clipPath>
      </defs>

      {/* measured data points floating around the instrument */}
      <DataPoint x={4} y={62} err={7} className="text-[#f9ab00]" />
      <DataPoint x={153} y={38} err={6} className="text-[#e94235] dark:text-[#ff8a80]" />
      <DataPoint x={156} y={96} err={8} className="text-[#00897b] dark:text-[#5ad8cc]" />

      {/* frame of the arch */}
      <path d="M20 140 V70 A60 60 0 0 1 140 70 V140 Z" className="fill-[#1558b0] dark:fill-[#a8c7fa]" />

      {/* the screen */}
      <g clipPath="url(#scope-screen)">
        <rect x={0} y={0} width={160} height={152} className="fill-[#0f1a2e] dark:fill-[#07101f]" />
        <g stroke="#a8c7fa" strokeWidth={0.6} opacity={0.16}>
          {COLS.map((x) => (
            <line key={`c${x}`} x1={x} y1={0} x2={x} y2={152} />
          ))}
          {ROWS.map((y) => (
            <line key={`r${y}`} x1={0} y1={y} x2={160} y2={y} />
          ))}
        </g>
        {/* centre axes with small ticks */}
        <g stroke="#a8c7fa" strokeWidth={0.8} opacity={0.38}>
          <line x1={0} y1={MID_Y} x2={160} y2={MID_Y} />
          <line x1={80} y1={0} x2={80} y2={152} />
          {Array.from({ length: 21 }, (_, i) => SCREEN.left + (i * (SCREEN.right - SCREEN.left)) / 20).map((x) => (
            <line key={`t${x}`} x1={x} y1={MID_Y - 1.6} x2={x} y2={MID_Y + 1.6} />
          ))}
        </g>
        {/* the trace: a soft glow under a sharp line */}
        <g className="scope-trace">
          <path d={TRACE} fill="none" stroke="#5fe0a0" strokeWidth={5} opacity={0.18} strokeLinejoin="round" />
          <path d={TRACE} fill="none" stroke="#7cf0b8" strokeWidth={1.8} strokeLinejoin="round" />
        </g>
        <text x={33} y={127} fill="#a8c7fa" opacity={0.75} fontSize={7} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          CH1 50 Hz
        </text>
      </g>

      {/* instrument base with two knobs */}
      <rect x={12} y={136} width={136} height={14} rx={4} className="fill-[#dadce0] dark:fill-[#3c4043]" />
      <circle cx={118} cy={143} r={3.4} className="fill-[#f9ab00]" />
      <circle cx={131} cy={143} r={3.4} className="fill-[#1558b0] dark:fill-[#a8c7fa]" />
      <rect x={24} y={141.5} width={30} height={3} rx={1.5} className="fill-[#9aa0a6] dark:fill-[#5f6368]" />
    </svg>
  );
}
