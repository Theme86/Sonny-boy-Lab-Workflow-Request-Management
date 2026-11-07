// components/users/rowActions.ts — what a user row needs from the page to show and change a person.
import type { Role, User } from '@/lib/users';

export type RowActions = {
  me: User;
  busyId: number | null;
  updateRole: (u: User, role: Role) => void;
  toggleActive: (u: User) => void;
};
