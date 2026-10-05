// lib/users.ts — user types and display helpers shared by the profile pages
export type Role = 'member' | 'ta' | 'lecturer' | 'lab_manager';

export type User = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  active: boolean;
};

export type UserListResponse = {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const ROLES: Role[] = ['member', 'ta', 'lecturer', 'lab_manager'];

export const ROLE_LABELS: Record<Role, string> = {
  member: 'Lab Member',
  ta: 'Teaching Assistant',
  lecturer: 'Lecturer / Researcher',
  lab_manager: 'Lab Manager',
};

export const ROLE_STYLES: Record<Role, string> = {
  member: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700',
  ta: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800',
  lecturer: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800',
  lab_manager: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800',
};

export function fullName(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export function initials(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const letters = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.trim();
  return (letters || user.email.charAt(0)).toUpperCase();
}

export function formatDate(value: string | null, withTime = false): string {
  if (!value) return 'Never';
  const date = new Date(value);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
