// components/users/FilterSelects.tsx — the role and status dropdowns above the user list.
import { ui } from '@/lib/ui';
import { ROLE_LABELS, ROLES, type Role } from '@/lib/users';
import type { StatusFilter } from './useUserQuery';

type Props = { role: Role | ''; status: StatusFilter; onRole: (v: Role | '') => void; onStatus: (v: StatusFilter) => void };

export function FilterSelects({ role, status, onRole, onStatus }: Props) {
  return (
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
  );
}
