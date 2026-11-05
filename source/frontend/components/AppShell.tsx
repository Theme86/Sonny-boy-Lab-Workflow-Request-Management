// components/AppShell.tsx
// Wraps logged-in pages: loads the current user (redirects to /login if not signed in),
// sends new users to "Create profile", and draws the top bar (see components/shell/).
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { CurrentUserProvider, useCurrentUser } from '@/hooks/useCurrentUser';
import { fontStyle, fontVariables } from '@/lib/fonts';
import { ui } from '@/lib/ui';

export { NAV_ITEMS } from '@/components/shell/navConfig';

const SETUP_PATH = '/profile/setup';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className={`flex min-h-screen flex-1 flex-col ${ui.page} ${fontVariables}`} style={fontStyle}>
        <TopBar />
        <main className="w-full min-w-0 flex-1 px-4 pt-5 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1680px]">
            <ShellContent>{children}</ShellContent>
          </div>
        </main>
      </div>
    </CurrentUserProvider>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-24" role="status">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-vl-line border-t-vl-accent" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const { user, loading, error, reload } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  // New users must finish "Create profile" first; finished users can't reopen it.
  const needsSetup = !!user && !user.profileCompletedAt;
  const onSetupPage = pathname === SETUP_PATH;
  const redirectTo = needsSetup && !onSetupPage ? SETUP_PATH : !needsSetup && onSetupPage && user ? '/profile' : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (loading || redirectTo) return <Spinner />;
  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-[22px]">Can&apos;t load your profile</h1>
        <p className={`mt-2 text-sm ${ui.muted}`}>{error}. Check that the backend is running, then try again.</p>
        <button type="button" onClick={() => reload()} className={`${ui.btnOutline} mt-6`}>
          Try again
        </button>
      </div>
    );
  }
  if (!user) return null; // redirecting to /login
  return <>{children}</>;
}
