// Small helpers shared by the tests.
import type { User } from '@/lib/users';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    userId: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@ku.th',
    role: 'member',
    avatarUrl: null,
    bannerUrl: null,
    createdAt: '2026-01-05T12:00:00.000Z',
    lastLoginAt: null,
    active: true,
    department: null,
    bio: null,
    profileCompletedAt: '2026-01-06T12:00:00.000Z',
    ...overrides,
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A File of the given size/type without allocating real content. */
export function makeFile(name: string, type: string, bytes = 10): File {
  const file = new File([new Uint8Array(Math.min(bytes, 16))], name, { type });
  if (bytes > 16) Object.defineProperty(file, 'size', { value: bytes });
  return file;
}
