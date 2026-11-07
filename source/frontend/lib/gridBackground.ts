// lib/gridBackground.ts — the graph-paper background shared by the login page and the dashboard:
// faint 24px lines with a stronger line every 4th, drawn with gradients (no image to load).
import type { CSSProperties } from 'react';

const line = (alpha: number, direction: 'right' | 'bottom') =>
  `linear-gradient(to ${direction}, rgb(128 134 139 / ${alpha}) 1px, transparent 1px)`;

export const GRID_STYLE: CSSProperties = {
  backgroundImage: [line(0.16, 'right'), line(0.16, 'bottom'), line(0.06, 'right'), line(0.06, 'bottom')].join(', '),
  backgroundSize: '96px 96px, 96px 96px, 24px 24px, 24px 24px',
  backgroundPosition: 'center top',
};
