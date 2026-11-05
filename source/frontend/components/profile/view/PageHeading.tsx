// components/profile/view/PageHeading.tsx — page title row used by most pages.
import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';

/** Page title row: heading on the left, optional actions on the right. */
export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-9 font-normal">{title}</h1>
        {subtitle && <p className={`mt-1 max-w-2xl text-base ${ui.muted}`}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
