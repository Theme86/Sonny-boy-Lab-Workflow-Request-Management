// components/shell/navConfig.tsx
// What the top bar links to (the flat list, and the two dropdown groups), plus the class names and
// "is this link active?" helpers shared by the desktop bar, the phone tabs and the dropdown.
import type { ComponentType } from 'react';
import { FlaskIcon, HomeIcon, MicroscopeIcon, RequestIcon } from '@/components/icons';

export type IconType = ComponentType<{ width?: number; height?: number; className?: string }>;
export type NavLink = { href: string; label: string; icon: IconType };
export type NavGroup = { key: string; label: string; icon: IconType; links: NavLink[] };

// Not in your icon set yet, so it lives here. Move it to components/icons if you prefer.
function CalendarIcon({ width = 24, height = 24, className }: { width?: number; height?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" aria-hidden className={className}>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
    </svg>
  );
}

// Flat list: still used by the dashboard cards (add a '/sessions' line to its DESCRIPTIONS).
export const NAV_ITEMS: NavLink[] = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/requests', label: 'Requests', icon: RequestIcon },
  { href: '/labsessions', label: 'Lab sessions', icon: CalendarIcon },
  { href: '/consumables', label: 'Consumables', icon: FlaskIcon },
  { href: '/equipment', label: 'Equipment', icon: MicroscopeIcon },
  { href: '/rooms', label: 'Rooms', icon: RequestIcon },
];

const byHref = (href: string) => NAV_ITEMS.find((i) => i.href === href)!;

// Top bar menus. Change a group's `label` to rename its button.
export const NAV_GROUPS: NavGroup[] = [
  { key: 'requests', label: 'Requests', icon: RequestIcon, links: [byHref('/requests'), byHref('/labsessions')] },
  { key: 'items', label: 'Items', icon: MicroscopeIcon, links: [byHref('/equipment'), byHref('/consumables'), byHref('/rooms')] },
];

const GROUPED_HREFS = new Set(NAV_GROUPS.flatMap((g) => g.links.map((l) => l.href)));

/** Links that are not inside a dropdown keep their own button. */
export const ungrouped = (items: NavLink[]) => items.filter((i) => !GROUPED_HREFS.has(i.href));

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const isGroupActive = (pathname: string, group: NavGroup) =>
  group.links.some((l) => isActive(pathname, l.href));

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
