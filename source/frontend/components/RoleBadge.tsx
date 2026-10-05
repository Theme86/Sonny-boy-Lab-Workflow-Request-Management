// components/RoleBadge.tsx
import { ui } from '@/lib/ui';
import { ROLE_LABELS, type Role } from '@/lib/users';

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ui.border} ${ui.muted}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="h-2 w-2 rounded-full bg-[#1e8e3e]" aria-hidden />
      Active
    </span>
  ) : (
    <span className={`inline-flex items-center gap-2 text-sm ${ui.muted}`}>
      <span className="h-2 w-2 rounded-full bg-[#9aa0a6]" aria-hidden />
      Deactivated
    </span>
  );
}
