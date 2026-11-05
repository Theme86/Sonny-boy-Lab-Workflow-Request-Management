// app/dashboard/page.tsx — Home inside the app (the public landing page at / links here).
// One request to /api/dashboard; the server decides what each role gets, so this page just shows what arrives.
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/DashboardStates';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDashboard } from '@/hooks/useDashboard';
import { GRID_STYLE } from '@/lib/gridBackground';

export default function DashboardPage() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}

function Home() {
  const { user } = useCurrentUser();
  const [reloadKey, setReloadKey] = useState(0);
  const state = useDashboard(reloadKey);
  if (!user) return null;

  return (
    <div className="-mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" style={GRID_STYLE}>
      <DashboardHeader firstName={user.firstName} role={user.role} />
      {state.status === 'loading' && <DashboardSkeleton />}
      {state.status === 'error' && <DashboardError message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />}
      {state.status === 'ready' && <DashboardView data={state.data} window={state.window} />}
    </div>
  );
}
