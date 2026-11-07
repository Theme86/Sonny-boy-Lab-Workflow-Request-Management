// lib/fontStacks.ts — CSS font-family stacks for the fonts loaded in lib/fonts.ts.
// Plain strings in their own file, so components can use them without loading next/font (e.g. in tests).
export const sansFamily = 'var(--font-plex-thai), system-ui, sans-serif';
/** For readings, IDs and timestamps. JetBrains Mono has no Thai, so Thai falls back to Plex Sans Thai. */
export const monoFamily = 'var(--font-lab-mono), var(--font-plex-thai), ui-monospace, monospace';
