// components/icons.tsx — small inline icons (24×24, currentColor)
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden focusable="false" {...props}>
      {children}
    </svg>
  );
}

/** The lab's mark: a simple vase silhouette. */
export function VaseMark(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 2.5h6v2.2l-.9.9c2.6 1.6 4.4 4.3 4.4 7.6 0 4.6-3 8.3-6.5 8.3s-6.5-3.7-6.5-8.3c0-3.3 1.8-6 4.4-7.6L9 4.7z" />
    </Svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z" />
    </Svg>
  );
}

export function GroupIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7.5 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13.5c-2.8 0-7 1.4-7 4.2V20h14v-2.3c0-2.8-4.2-4.2-7-4.2zm7.5.4c-.4 0-.9 0-1.4.1 1.1.9 1.9 2.1 1.9 3.7V20h5v-2.3c0-2.4-3.5-3.8-5.5-3.8z" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.3 6.7a1 1 0 0 0 0 1.4l3.9 3.9-3.9 3.9a1 1 0 1 0 1.4 1.4l4.6-4.6a1 1 0 0 0 0-1.4l-4.6-4.6a1 1 0 0 0-1.4 0z" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.7 6.7a1 1 0 0 1 0 1.4L10.8 12l3.9 3.9a1 1 0 1 1-1.4 1.4l-4.6-4.6a1 1 0 0 1 0-1.4l4.6-4.6a1 1 0 0 1 1.4 0z" />
    </Svg>
  );
}

export function ArrowBackIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
    </Svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.2 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.2L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 2 11.5h3V20h5.5v-5.5h3V20H19v-8.5h3z" />
    </Svg>
  );
}

/** Requests: a clipboard with lines. */
export function RequestIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 3.5h3a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h3A3 3 0 0 1 12 1a3 3 0 0 1 3 2.5zM12 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7.5 9v2h9V9zm0 4v2h9v-2zm0 4v2h6v-2z" />
    </Svg>
  );
}

/** Consumables: a flask. */
export function FlaskIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2h8v2h-1.2v5.1l5.7 9.6A2.2 2.2 0 0 1 18.6 22H5.4a2.2 2.2 0 0 1-1.9-3.3l5.7-9.6V4H8zm3.2 2v5.6L9.4 12.7h5.2l-1.8-3.1V4z" />
    </Svg>
  );
}

/** Equipment: a microscope. */
export function MicroscopeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 2.6 13 1.1l3.4 7.8-3.5 1.5zM10 11.5a3.5 3.5 0 0 0 3.2 3.5l.8-1.9 1.8-.8a5.5 5.5 0 0 1-3.6 4.6L13 18h6v2H5v-2h5.2a5.5 5.5 0 0 1-2.2-6.5zM4 20h16v2H4z" />
    </Svg>
  );
}
