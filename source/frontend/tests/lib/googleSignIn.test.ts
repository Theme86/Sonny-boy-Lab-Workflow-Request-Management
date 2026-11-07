import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// the module remembers a loading script, so each test gets a fresh copy
async function load() {
  vi.resetModules();
  return import('@/lib/googleSignIn');
}

const scripts = () => document.querySelectorAll('script[src*="accounts.google.com/gsi/client"]');

beforeEach(() => {
  delete (window as { google?: unknown }).google;
  document.body.innerHTML = '';
});
afterEach(() => {
  delete (window as { google?: unknown }).google;
});

describe('buttonWidth', () => {
  test('stays between the 200 and 400 px Google accepts', async () => {
    const { buttonWidth } = await load();
    expect(buttonWidth(100)).toBe(200);
    expect(buttonWidth(320)).toBe(320);
    expect(buttonWidth(900)).toBe(400);
  });

  test('rounds down to whole pixels', async () => {
    const { buttonWidth } = await load();
    expect(buttonWidth(300.9)).toBe(300);
  });
});

describe('loadGoogleScript', () => {
  test('does not add a script when Google is already there', async () => {
    const google = { accounts: { id: { initialize: vi.fn(), renderButton: vi.fn() } } };
    (window as { google?: unknown }).google = google;
    const { loadGoogleScript } = await load();
    await expect(loadGoogleScript()).resolves.toBe(google);
    expect(scripts()).toHaveLength(0);
  });

  test('adds the script once, even when asked twice, and resolves when it has loaded', async () => {
    const { loadGoogleScript } = await load();
    const first = loadGoogleScript();
    const second = loadGoogleScript();
    expect(second).toBe(first);
    expect(scripts()).toHaveLength(1);

    const google = { accounts: { id: { initialize: vi.fn(), renderButton: vi.fn() } } };
    (window as { google?: unknown }).google = google;
    (scripts()[0] as HTMLScriptElement).onload?.(new Event('load'));
    await expect(first).resolves.toBe(google);
  });

  test('rejects when the script loads but Google is missing', async () => {
    const { loadGoogleScript } = await load();
    const promise = loadGoogleScript();
    (scripts()[0] as HTMLScriptElement).onload?.(new Event('load'));
    await expect(promise).rejects.toThrow(/not available/);
  });

  test('a network failure rejects, removes the script and allows another try', async () => {
    const { loadGoogleScript } = await load();
    const promise = loadGoogleScript();
    (scripts()[0] as HTMLScriptElement).onerror?.(new Event('error'));
    await expect(promise).rejects.toThrow(/Could not load/);
    expect(scripts()).toHaveLength(0);

    loadGoogleScript().catch(() => {});
    expect(scripts()).toHaveLength(1);
  });
});

describe('renderGoogleButton', () => {
  function setup() {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    const google = { accounts: { id: { initialize, renderButton } } };
    const element = document.createElement('div');
    element.innerHTML = '<span>old button</span>';
    return { google, initialize, renderButton, element };
  }

  test('passes the credential to the callback', async () => {
    const { renderGoogleButton } = await load();
    const { google, initialize, element } = setup();
    const onCredential = vi.fn();
    renderGoogleButton(google, element, { dark: false, width: 320, onCredential });
    initialize.mock.calls[0][0].callback({ credential: 'ID-TOKEN' });
    expect(onCredential).toHaveBeenCalledWith('ID-TOKEN');
  });

  test('clears the old button before drawing a new one', async () => {
    const { renderGoogleButton } = await load();
    const { google, element } = setup();
    renderGoogleButton(google, element, { dark: false, width: 320, onCredential: vi.fn() });
    expect(element.children).toHaveLength(0);
  });

  test('light page: outline button; dark page: black button; width is passed on', async () => {
    const { renderGoogleButton } = await load();
    const light = setup();
    renderGoogleButton(light.google, light.element, { dark: false, width: 300, onCredential: vi.fn() });
    expect(light.renderButton.mock.calls[0][1]).toMatchObject({ theme: 'outline', width: 300, size: 'large' });

    const dark = setup();
    renderGoogleButton(dark.google, dark.element, { dark: true, width: 280, onCredential: vi.fn() });
    expect(dark.renderButton.mock.calls[0][1]).toMatchObject({ theme: 'filled_black', width: 280 });
  });
});
