// components/equipmentIcons.tsx small inline icons for the equipment pages.
import type { SVGProps } from 'react';
 
type IconProps = SVGProps<SVGSVGElement>;
 
function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden focusable="false" {...props}>
      {children}
    </svg>
  );
}
 
/** Lab flask: used for the "Equipment" navigation item. */
export function EquipmentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 2v2h1v5.2L4.6 18.4A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.7-3.1L14 9.2V4h1V2H9zm3 2h0v5.8l.3.5L14.9 14H9.1l2.6-3.7.3-.5V4zM6.3 19.5l1.5-2.5h8.4l1.5 2.5H6.3z" />
    </Svg>
  );
}
 
export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
    </Svg>
  );
}
 
export function EditIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </Svg>
  );
}
 
export function DeleteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </Svg>
  );
}
 
export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />
    </Svg>
  );
}
 
/** Picture frame: shown when an item has no photo. */
export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
    </Svg>
  );
}