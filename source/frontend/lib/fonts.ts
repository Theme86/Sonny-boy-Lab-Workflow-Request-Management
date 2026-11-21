// lib/fonts.ts — IBM Plex Sans Thai for all text (it covers both Thai and Latin, so names in either
// language look the same), and JetBrains Mono for equipment IDs, readings and times.
// JetBrains Mono has no Thai letters, so the mono stack falls back to Plex Sans Thai for Thai text.
import { IBM_Plex_Sans_Thai, JetBrains_Mono } from 'next/font/google';
import { sansFamily } from '@/lib/fontStacks';

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-thai',
  display: 'swap',
});
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-lab-mono', display: 'swap' });

/** Put on the outermost element of a page. */
export const fontVariables = `${plexThai.variable} ${mono.variable}`;
export const fontStyle = { fontFamily: sansFamily };
export { monoFamily } from '@/lib/fontStacks';
