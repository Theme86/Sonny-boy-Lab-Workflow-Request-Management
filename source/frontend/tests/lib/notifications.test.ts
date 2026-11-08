import { describe, expect, test } from 'vitest';
import { badgeText, notificationHref } from '@/lib/notifications';

const target = (o: { requestId?: number; labSessionId?: number; consumableId?: number }) => ({
  requestId: null,
  labSessionId: null,
  consumableId: null,
  ...o,
});

describe('notificationHref', () => {
  test('opens the request, the lab sessions list or the consumables list', () => {
    expect(notificationHref(target({ requestId: 4 }))).toBe('/requests/4');
    expect(notificationHref(target({ labSessionId: 9 }))).toBe('/labsessions');
    expect(notificationHref(target({ consumableId: 2 }))).toBe('/consumables');
  });

  test('goes nowhere when the notification has no target', () => {
    expect(notificationHref(target({}))).toBeNull();
  });
});

test('badgeText caps at 99+', () => {
  expect(badgeText(5)).toBe('5');
  expect(badgeText(120)).toBe('99+');
});
