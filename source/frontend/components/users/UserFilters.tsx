// components/users/UserFilters.tsx — search box plus role and status filters.
import { SearchIcon } from '@/components/icons';
import { ui } from '@/lib/ui';
import { ROLE_LABELS, ROLES, type Role } from '@/lib/users';
import type { StatusFilter } from './useUserList';

type Props = {
  search: string;
  role: Role | '';
  status: StatusFilter;
  onSearch: (v: string) => void;
  onRole: (v: Role | '') => void;
  onStatus: (v: StatusFilter) => void;
};

export function UserFilters({ search, role, status, onSearch, onRole, onStatus }: Props) {
  return (
    <div className={`flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center ${ui.border}`}>
      <label className="relative block lg:flex-1">
        <span className="sr-only">Search users</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-vl-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, email, ID or department"
          className="h-11 w-full rounded-full bg-vl-hover pr-4 pl-11 text-[15px] outline-none placeholder:text-vl-muted focus:bg-white focus:ring-2 focus:ring-vl-accent dark:bg-vl-surface-2"
        />
      </label>
      <div className="flex gap-3">
        <select value={role} onChange={(e) => onRole(e.target.value as Role | '')} className={`${ui.select} flex-1 lg:w-48 lg:flex-none`} aria-label="Filter by role">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => onStatus(e.target.value as StatusFilter)} className={`${ui.select} flex-1 lg:w-40 lg:flex-none`} aria-label="Filter by status">
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>
    </div>
  );
}
