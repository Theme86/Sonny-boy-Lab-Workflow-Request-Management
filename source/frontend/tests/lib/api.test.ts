import { beforeEach, describe, expect, test, vi } from 'vitest';
import { API_URL, ApiError, apiFetch, imageUrl } from '@/lib/api';
import { jsonResponse } from '../helpers';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

// resolves with the error that apiFetch rejects with
const failure = async () => {
  try {
    await apiFetch('/api/x');
  } catch (e) {
    return e as ApiError;
  }
  throw new Error('apiFetch did not reject');
};

describe('apiFetch', () => {
  test('returns the parsed JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ hello: 'world' }));
    await expect(apiFetch('/api/x')).resolves.toEqual({ hello: 'world' });
  });

  test('calls the backend URL and always sends the login cookie', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await apiFetch('/api/users/me');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/users/me`);
    expect(init.credentials).toBe('include');
  });

  test('`json` is stringified and sent with a JSON content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await apiFetch('/api/x', { method: 'PATCH', json: { a: 1, b: 'two' } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe('{"a":1,"b":"two"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  test('without `json` no JSON content type is added', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await apiFetch('/api/x', { method: 'DELETE' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({});
    expect(init.body).toBeUndefined();
  });

  test('a raw body (file upload) is passed through untouched with the caller\'s headers', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await apiFetch('/api/users/me/avatar', { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: file });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(file);
    expect(init.headers['Content-Type']).toBe('image/png');
  });

  test('non-2xx throws ApiError with the status and the backend message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Forbidden' }, 403));
    const err = await failure();
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(403);
    expect(err.message).toBe('Forbidden');
  });

  test('keeps field-by-field details of a 400 validation error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Validation failed', details: { title: 'Title is required' } }, 400));
    const err = await failure();
    expect(err.details).toEqual({ title: 'Title is required' });
  });

  test('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>oops</html>', { status: 502 }));
    const err = await failure();
    expect(err.status).toBe(502);
    expect(err.message).toBe('Request failed (502)');
  });

  test('a network failure becomes ApiError status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await failure();
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toBe('Could not reach the server');
  });
});

describe('imageUrl', () => {
  test('no path means no image', () => {
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
    expect(imageUrl('')).toBeNull();
  });

  test('a stored backend path gets the API address in front', () => {
    expect(imageUrl('/userImages/3/avatar.png?v=1')).toBe(`${API_URL}/userImages/3/avatar.png?v=1`);
  });

  test('a full URL (e.g. a Google picture) is left alone', () => {
    expect(imageUrl('https://lh3.googleusercontent.com/a/photo')).toBe('https://lh3.googleusercontent.com/a/photo');
    expect(imageUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
  });
});
