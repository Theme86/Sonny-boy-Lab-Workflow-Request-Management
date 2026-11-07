// components/users/UserPager.tsx — "1–20 of 57" with previous / next buttons.
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import type { UserListResponse } from '@/lib/users';

type Props = { data: UserListResponse; page: number; loading: boolean; onPage: (page: number) => void };

const BUTTON = `rounded-full p-2 disabled:opacity-40 ${ui.hover} ${ui.focus}`;

export function UserPager({ data, page, loading, onPage }: Props) {
  const first = (data.page - 1) * data.pageSize + 1;
  const last = Math.min(data.page * data.pageSize, data.total);
  return (
    <div className={`flex items-center justify-end gap-2 border-t px-4 py-2 text-sm ${ui.border} ${ui.muted}`}>
      <span className="mr-2">
        {first}–{last} of {data.total}
      </span>
      <button type="button" aria-label="Previous page" className={BUTTON} disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>
        <ChevronLeftIcon />
      </button>
      <button type="button" aria-label="Next page" className={BUTTON} disabled={page >= data.totalPages || loading} onClick={() => onPage(page + 1)}>
        <ChevronRightIcon />
      </button>
    </div>
  );
}
