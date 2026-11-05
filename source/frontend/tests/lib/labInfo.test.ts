import { describe, expect, test } from 'vitest';
import { readLabInfo, reportProblemHref } from '@/lib/labInfo';

describe('readLabInfo', () => {
  test('nothing set means nothing shown', () => {
    expect(readLabInfo({})).toEqual({ hours: null, contactEmail: null, rulesUrl: null });
  });

  test('values are trimmed, and blank counts as not set', () => {
    expect(readLabInfo({ hours: '  Mon–Fri 09:00–17:00 ', contactEmail: '   ', rulesUrl: '' })).toEqual({
      hours: 'Mon–Fri 09:00–17:00',
      contactEmail: null,
      rulesUrl: null,
    });
  });

  test('accepts a valid email and rejects a malformed one', () => {
    expect(readLabInfo({ contactEmail: 'lab@ku.th' }).contactEmail).toBe('lab@ku.th');
    expect(readLabInfo({ contactEmail: 'not an email' }).contactEmail).toBeNull();
    expect(readLabInfo({ contactEmail: 'lab@ku' }).contactEmail).toBeNull();
  });

  test('the rules link must be http(s) or a path on this site', () => {
    expect(readLabInfo({ rulesUrl: 'https://example.ac.th/rules.pdf' }).rulesUrl).toBe('https://example.ac.th/rules.pdf');
    expect(readLabInfo({ rulesUrl: '/lab-rules.pdf' }).rulesUrl).toBe('/lab-rules.pdf');
    expect(readLabInfo({ rulesUrl: 'javascript:alert(1)' }).rulesUrl).toBeNull();
    expect(readLabInfo({ rulesUrl: 'ftp://x' }).rulesUrl).toBeNull();
  });
});

test('reportProblemHref opens an email with a recognisable subject', () => {
  expect(reportProblemHref('lab@ku.th')).toBe('mailto:lab@ku.th?subject=%5BVase%20Lab%5D%20Problem%20report');
});
