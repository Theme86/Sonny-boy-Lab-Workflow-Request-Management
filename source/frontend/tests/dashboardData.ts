// A complete dashboard response for the tests; each test overrides only the parts it cares about.
import type { Dashboard } from '@/lib/dashboardTypes';

export function makeDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    generatedAt: '2026-11-05T12:00:00.000Z',
    role: 'member',
    me: {
      nextSession: null,
      requests: { counts: { open: 0, in_review: 0, approved: 0, in_progress: 0, blocked: 0, completed: 0, rejected: 0, closed: 0 }, active: 0 },
      notifications: { unread: 0, latest: [] },
    },
    lab: {
      consumables: { total: 0, lowStock: { total: 0, items: [] }, expiring: { total: 0, items: [] } },
      equipment: { kinds: 0, unitsAvailable: 0, unitsTotal: 0, allTaken: { total: 0, items: [] } },
      rooms: { from: '2026-11-05T00:00:00.000Z', to: '2026-11-06T00:00:00.000Z', rooms: [] },
    },
    attention: null,
    ...overrides,
  };
}
