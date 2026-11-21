// components/landing/LandingOverview.tsx — the part of the landing page under the hero: what Vase Lab has,
// what each part lets you do, who can do what, and how a request moves. Everything here describes a
// feature the app really has; keep it in step when features change. Styles: app/landing.css (lp-*).
import Link from 'next/link';
import type { ReactNode } from 'react';

// 24×24 stroke icons
const ICONS: Record<string, ReactNode> = {
  request: (
    <>
      <path d="M7 4h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  room: (
    <>
      <path d="M4 20V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15M4 20h16M15 9h4a1 1 0 0 1 1 1v10" />
      <path d="M11 12v1" />
    </>
  ),
  scope: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M8 21h8M12 17v4" />
    </>
  ),
  flask: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9" />,
  dashboard: (
    <>
      <rect x="3" y="4" width="8" height="8" rx="1" />
      <rect x="13" y="4" width="8" height="5" rx="1" />
      <rect x="13" y="11" width="8" height="9" rx="1" />
      <rect x="3" y="14" width="8" height="6" rx="1" />
    </>
  ),
};

const FEATURES = [
  {
    icon: 'request',
    title: 'Requests',
    href: '/requests',
    text: 'One place to ask the lab for anything, instead of email and chat.',
    points: [
      'Five types: maintenance, access permission, consumable orders, equipment reservations and general tickets',
      'Follow each request’s status, with a full history of every change',
      'Staff assign an owner and move it from open to closed',
      'Industry collaborations keep the partner’s details restricted to the people involved',
    ],
  },
  {
    icon: 'calendar',
    title: 'Lab sessions',
    href: '/labsessions',
    text: 'Book time in a lab room before you start an experiment.',
    points: [
      'Choose a room and one or more time slots in a single booking',
      'Lecturers or the lab manager approve or reject the session, and you are notified',
      'A room can’t be booked twice for the same time',
    ],
  },
  {
    icon: 'room',
    title: 'Rooms',
    href: '/rooms',
    text: 'See every lab room and when it is in use.',
    points: ['Name, location, capacity and a photo for each room', 'A timeline of the day’s bookings on the dashboard'],
  },
  {
    icon: 'scope',
    title: 'Equipment',
    href: '/equipment',
    text: 'A catalogue of the lab’s instruments.',
    points: [
      'Photos, categories, properties and where each item is kept',
      'How many units are available right now',
      'Search, filter and sort to find what you need',
    ],
  },
  {
    icon: 'flask',
    title: 'Consumables',
    href: '/consumables',
    text: 'Chemicals and supplies, kept in view.',
    points: [
      'Stock levels with GHS hazard labels and storage notes',
      'An alert when something runs low',
      'A reminder 30 days before anything expires',
    ],
  },
  {
    icon: 'dashboard',
    title: 'Dashboard & notifications',
    href: '/dashboard',
    text: 'Your starting screen, built for your role.',
    points: [
      'Your own requests and sessions, and what needs your attention',
      'In-app notifications when something changes',
      'A profile with your picture and details',
    ],
  },
] as const;

const ROLES = [
  { role: 'Lab member', can: 'Submit requests, book lab sessions and follow their own work.' },
  { role: 'Teaching assistant', can: 'Everything a member can, plus triage requests and update their status.' },
  { role: 'Lecturer', can: 'Approve lab sessions and submit industry collaboration requests.' },
  { role: 'Lab manager', can: 'See and manage everything: requests, rooms, equipment, consumables and user roles.' },
] as const;

const FLOW = ['Open', 'In review', 'Approved', 'In progress', 'Completed', 'Closed'] as const;

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export function LandingOverview() {
  return (
    <>
      <section id="features" aria-labelledby="lp-features-title" className="lp-section">
        <p className="lp-eyebrow">What’s inside</p>
        <h2 id="lp-features-title" className="lp-title">
          Everything the lab runs on
        </h2>
        <p className="lp-lead">Six parts, one sign-in. Here is what each one lets you do.</p>
        <ul className="lp-grid">
          {FEATURES.map(({ icon, title, href, text, points }) => (
            <li key={title} className="lp-card">
              <span className="lp-card-icon">
                <Icon name={icon} />
              </span>
              <h3 className="lp-card-title">{title}</h3>
              <p className="lp-card-text">{text}</p>
              <ul className="lp-points">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link href={href} className="lp-card-link">
                Open {title.toLowerCase()} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lp-flow-title" className="lp-section">
        <p className="lp-eyebrow">How a request moves</p>
        <h2 id="lp-flow-title" className="lp-title">
          From first ask to closed, on record
        </h2>
        <ol className="lp-flow">
          {FLOW.map((status) => (
            <li key={status}>{status}</li>
          ))}
        </ol>
        <p className="lp-lead">
          A request can also be marked <strong>Blocked</strong> while it waits on something, or <strong>Rejected</strong>. Closed
          requests leave the active list but stay in the history.
        </p>
      </section>

      <section aria-labelledby="lp-roles-title" className="lp-section">
        <p className="lp-eyebrow">Who can do what</p>
        <h2 id="lp-roles-title" className="lp-title">
          Four roles, one lab
        </h2>
        <p className="lp-lead">Everyone starts as a lab member. The lab manager gives out the other roles.</p>
        <dl className="lp-roles">
          {ROLES.map(({ role, can }) => (
            <div key={role} className="lp-role">
              <dt>{role}</dt>
              <dd>{can}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
