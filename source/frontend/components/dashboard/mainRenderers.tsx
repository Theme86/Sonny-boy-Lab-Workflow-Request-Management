// components/dashboard/mainRenderers.tsx — how each main-column section is drawn from the response.
// A renderer returns nothing when the server did not send that part (because of the role).
import type { ReactNode } from 'react';
import type { Dashboard, DayWindow } from '@/lib/dashboardTypes';
import { ApprovalQueue } from './ApprovalQueue';
import { MemberAlerts } from './MemberAlerts';
import { RecentRequests } from './RecentRequests';
import { RequestQueue } from './RequestQueue';
import { RoomTimeline } from './RoomTimeline';
import type { MainSection } from './sectionOrder';
import { UpcomingSessions } from './UpcomingSessions';

type Renderers = Record<MainSection, (data: Dashboard, window: DayWindow) => ReactNode>;

export const MAIN_SECTIONS: Renderers = {
  alerts: ({ me }) => <MemberAlerts counts={me.requests.counts} />,
  approvals: ({ attention }) => attention?.pendingSessions && <ApprovalQueue queue={attention.pendingSessions} />,
  requestQueue: ({ attention }) => attention?.requests && <RequestQueue requests={attention.requests} />,
  rooms: ({ lab }, window) => <RoomTimeline rooms={lab.rooms} window={window} />,
  sessions: ({ me }) => <UpcomingSessions sessions={me.upcomingSessions} />,
  myRequests: ({ me }) => <RecentRequests requests={me.requests.recent} active={me.requests.active} />,
};
