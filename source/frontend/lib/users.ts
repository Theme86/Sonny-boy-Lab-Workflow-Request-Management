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
  department: string | null;
  bio: string | null;
  profileCompletedAt: string | null;
  // Only returned for your own profile, or to the Lab Manager (undefined = hidden)
  studentId?: string | null;
  phone?: string | null;
};

/** Limits and checks shared by the create/edit profile forms (the backend checks the same rules). */
export const PROFILE_LIMITS = { name: 100, studentId: 20, phone: 20, department: 150, bio: 300 };

export type ProfileFields = {
  firstName: string;
  lastName: string;
  studentId: string;
  phone: string;
  department: string;
  bio: string;
};

export function validateProfile(f: ProfileFields): Partial<Record<keyof ProfileFields, string>> {
  const errors: Partial<Record<keyof ProfileFields, string>> = {};
  if (!f.firstName.trim()) errors.firstName = 'First name is required.';
  else if (f.firstName.trim().length > PROFILE_LIMITS.name) errors.firstName = `At most ${PROFILE_LIMITS.name} characters.`;
  if (!f.lastName.trim()) errors.lastName = 'Last name is required.';
  else if (f.lastName.trim().length > PROFILE_LIMITS.name) errors.lastName = `At most ${PROFILE_LIMITS.name} characters.`;
  const id = f.studentId.trim();
  if (id && !/^[0-9]+$/.test(id)) errors.studentId = 'Use numbers only.';
  else if (id.length > PROFILE_LIMITS.studentId) errors.studentId = `At most ${PROFILE_LIMITS.studentId} characters.`;
  const phone = f.phone.trim();
  if (phone && !/^\+?[0-9][0-9\s-]{5,}$/.test(phone)) errors.phone = 'Use digits, spaces or "-", e.g. 081-234-5678.';
  else if (phone.length > PROFILE_LIMITS.phone) errors.phone = `At most ${PROFILE_LIMITS.phone} characters.`;
  if (f.department.trim().length > PROFILE_LIMITS.department) errors.department = `At most ${PROFILE_LIMITS.department} characters.`;
  if (f.bio.trim().length > PROFILE_LIMITS.bio) errors.bio = `At most ${PROFILE_LIMITS.bio} characters.`;
  return errors;
}

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
