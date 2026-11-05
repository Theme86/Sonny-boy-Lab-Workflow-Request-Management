// components/profile/view/ProfileLayout.tsx
import type { ReactNode } from 'react';

/** Two columns on large screens: identity card on the left (stays in view), details on the right. */
export function ProfileLayout({ left, children }: { left: ReactNode; children: ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-20">{left}</div>
      <div>{children}</div>
    </div>
  );
}
