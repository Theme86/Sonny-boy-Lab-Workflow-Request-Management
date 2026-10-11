// lib/fonts.ts — Roboto for Latin text, Noto Sans Thai so Thai names render cleanly.
import { Noto_Sans_Thai, Roboto } from 'next/font/google';

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-roboto', display: 'swap' });
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], weight: ['400', '500', '700'], variable: '--font-noto-thai', display: 'swap' });

/** Put on the outermost element of a page. */
export const fontVariables = `${roboto.variable} ${notoThai.variable}`;
export const fontStyle = { fontFamily: 'var(--font-roboto), var(--font-noto-thai), system-ui, sans-serif' };
