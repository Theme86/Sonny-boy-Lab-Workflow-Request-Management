// lib/googleSignIn.ts — loads Google's "Sign in with Google" script and draws its button.
// Kept apart from the login page so the page only deals with layout and what happens after sign-in.

type CredentialResponse = { credential: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: { client_id: string | undefined; callback: (response: CredentialResponse) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let loading: Promise<GoogleIdentity> | null = null;

/** Resolves with `window.google` once the script is ready. The script is added only once per page. */
export function loadGoogleScript(): Promise<GoogleIdentity> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (loading) return loading;

  loading = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error('Google sign-in is not available')));
    script.onerror = () => {
      loading = null; // allow another try, e.g. after the network comes back
      script.remove();
      reject(new Error('Could not load Google sign-in'));
    };
    document.body.appendChild(script);
  });
  return loading;
}

/** Draws Google's button inside `element` and calls `onCredential` with the ID token after sign-in. */
export function renderGoogleButton(
  google: GoogleIdentity,
  element: HTMLElement,
  options: { dark: boolean; width: number; onCredential: (idToken: string) => void },
) {
  google.accounts.id.initialize({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    callback: (response) => options.onCredential(response.credential),
  });
  element.replaceChildren();
  google.accounts.id.renderButton(element, {
    theme: options.dark ? 'filled_black' : 'outline',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    logo_alignment: 'left',
    width: options.width,
  });
}

/** Google only accepts a pixel width between 200 and 400. */
export function buttonWidth(available: number) {
  return Math.max(200, Math.min(400, Math.floor(available)));
}
