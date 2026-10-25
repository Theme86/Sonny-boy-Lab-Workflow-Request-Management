// components/ThemeToggle.tsx — day/night switch: sun on a sky track (light), moon on a night track (dark).
'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { ui } from '@/lib/ui';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  // Animate only after a click. On page load the saved theme is applied right after hydration,
  // and without this the knob would visibly slide from the sun side to the moon side.
  const [animate, setAnimate] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => {
        setAnimate(true);
        toggleTheme();
      }}
      className={`relative inline-flex h-8 w-[60px] shrink-0 items-center overflow-hidden rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,.25)] ${animate ? 'transition-colors duration-300' : '[&_*]:transition-none!'} ${
        dark ? 'bg-[#1d2547]' : 'bg-[#7cc4fa]'
      } ${ui.focus} ${className}`}
    >
      {/* clouds (light) */}
      <span
        aria-hidden
        className={`absolute right-2 bottom-1.5 h-2.5 w-5 rounded-full bg-white/90 transition-all duration-300 ${
          dark ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      />
      <span
        aria-hidden
        className={`absolute right-5 bottom-2.5 h-3 w-3 rounded-full bg-white/90 transition-all duration-300 ${
          dark ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      />
      {/* stars (dark) */}
      {[
        'left-2.5 top-2 h-1 w-1',
        'left-5 top-4.5 h-0.5 w-0.5',
        'left-7 top-1.5 h-0.5 w-0.5',
        'left-3.5 top-5 h-[3px] w-[3px]',
      ].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute rounded-full bg-white transition-all duration-300 ${pos} ${
            dark ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
          }`}
        />
      ))}
      {/* knob: sun -> moon */}
      <span
        aria-hidden
        className={`relative z-10 h-6 w-6 rounded-full shadow-[0_1px_3px_rgba(0,0,0,.35)] transition-all duration-300 ease-out ${
          dark ? 'translate-x-[32px] bg-[#e4e7f0]' : 'translate-x-1 bg-[#ffc93c]'
        }`}
      >
        {/* moon craters */}
        <span className={`absolute top-1.5 left-2.5 h-2 w-2 rounded-full bg-[#c3c8d6] transition-opacity duration-300 ${dark ? 'opacity-100' : 'opacity-0'}`} />
        <span className={`absolute top-3.5 left-1 h-1.5 w-1.5 rounded-full bg-[#c3c8d6] transition-opacity duration-300 ${dark ? 'opacity-100' : 'opacity-0'}`} />
        <span className={`absolute top-4 left-4 h-1 w-1 rounded-full bg-[#c3c8d6] transition-opacity duration-300 ${dark ? 'opacity-100' : 'opacity-0'}`} />
      </span>
    </button>
  );
}
