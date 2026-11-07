// hooks/useDashboard.ts — loads the dashboard once and tells the page whether it is loading, failed or ready.
// setState is only called inside promise callbacks (the lint rule react-hooks/set-state-in-effect).
'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard, labDayWindow } from '@/lib/dashboard';
import type { DayWindow, Dashboard } from '@/lib/dashboardTypes';

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Dashboard; window: DayWindow };

export function useDashboard(reloadKey = 0): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const window = labDayWindow();
    fetchDashboard(window)
      .then((data) => !cancelled && setState({ status: 'ready', data, window }))
      .catch((err) => !cancelled && setState({ status: 'error', message: err.message ?? 'The dashboard could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return state;
}
