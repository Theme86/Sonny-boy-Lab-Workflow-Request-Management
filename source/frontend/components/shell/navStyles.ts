// components/shell/navStyles.ts — class names for the top bar's buttons, which sit on the coloured bar.

// Focus ring for controls sitting on the coloured top bar (the accent ring would vanish into it).
export const barFocus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vl-on-bar';

/** Rounded pill: desktop buttons (h-10) and the second row of phone choices (h-9). */
export const pill = (active: boolean, height = 'h-10') =>
  `flex ${height} items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors ${barFocus} ${
    active ? 'bg-vl-bar-active text-vl-on-bar-active' : 'text-vl-on-bar hover:bg-vl-bar-hover'
  }`;

/** Underlined tab on phones. */
export const tab = (active: boolean) =>
  `flex items-center gap-2 border-b-[3px] px-3 py-3 text-sm font-medium whitespace-nowrap ${barFocus} ${
    active ? 'border-vl-bar-active text-vl-on-bar' : 'border-transparent text-vl-on-bar-muted'
  }`;
