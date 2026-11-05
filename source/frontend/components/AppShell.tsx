// components/AppShell.tsx
// Wraps logged-in pages: loads the current user (redirects to /login if not signed in),
// sends new users to "Create profile", and draws the top bar (see components/shell/).
'use client';

import type { ReactNode } from 'react';
import { ShellContent } from '@/components/shell/ShellContent';
import { TopBar } from '@/components/shell/TopBar';
import { CurrentUserProvider } from '@/hooks/useCurrentUser';
import { fontStyle, fontVariables } from '@/lib/fonts';
import { ui } from '@/lib/ui';

export { NAV_ITEMS } from '@/components/shell/navConfig';

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
