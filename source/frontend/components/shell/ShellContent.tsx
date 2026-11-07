// components/shell/ShellContent.tsx — waits for the current user, and sends people to /login or "Create profile" as needed.
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ui } from '@/lib/ui';

const SETUP_PATH = '/profile/setup';

function Spinner() {
  return (
    <div className="flex justify-center py-24" role="status">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-vl-line border-t-vl-accent" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ShellContent({ children }: { children: ReactNode }) {
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
