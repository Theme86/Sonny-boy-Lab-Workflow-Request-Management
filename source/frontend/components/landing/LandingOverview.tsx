// components/landing/LandingOverview.tsx — the part of the landing page under the hero: what each page
// of the app is for, what the request statuses mean and what each role can do. It reuses the app's own
// nav list, status badges and role badges, so it looks like (and stays in step with) the real app.
// Everything here describes a feature the app really has: update it when features change.
import Link from 'next/link';
import StatusBadge from '@/app/requests/StatusBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { NAV_ITEMS } from '@/components/shell/navConfig';
import { STATUS_LABELS } from '@/lib/requests';
import { ui } from '@/lib/ui';
import type { Role } from '@/lib/users';

// What each page in the top bar is for, by its link.
const PAGES: Record<string, string> = {
  '/dashboard':
    'Your starting screen. It shows your own requests and lab sessions, what needs your attention, which consumables are low or expiring, and today’s room bookings. Notifications appear in the top bar.',
  '/requests':
    'Ask the lab for something: a maintenance job, access to a room or instrument, a consumables order, an equipment reservation or a general ticket. You can see who it is assigned to and every status change. Lecturers can also log industry collaborations; the partner’s details are only shown to the people involved.',
  '/labsessions':
    'Book a lab room for one or more time slots. A lecturer or the lab manager approves or rejects the booking, and a room can’t be booked twice for the same time.',
  '/consumables':
    'Chemicals and supplies with their stock, GHS hazard labels and storage notes. Lecturers and the lab manager are told when something runs low and 30 days before it expires.',
  '/equipment':
    'The lab’s instruments, with photos, categories, where each one is kept and how many units are free right now.',
  '/rooms': 'Every lab room with its location, capacity and photo.',
};

const STATUS_MEANING: Record<string, string> = {
  open: 'Just submitted, nobody has picked it up yet.',
  in_review: 'A TA, lecturer or the lab manager is looking at it.',
  approved: 'Accepted and waiting to be done.',
  in_progress: 'Someone is working on it.',
  blocked: 'Waiting on something else, such as a part or another approval.',
  completed: 'Done.',
  rejected: 'Not going ahead.',
  closed: 'Off the active list, but kept in the history.',
};

const ROLES: { role: Role; can: string }[] = [
  { role: 'member', can: 'Submit requests, book lab sessions and follow their own work. Everyone starts here.' },
  { role: 'ta', can: 'Also triages requests and updates their status.' },
  { role: 'lecturer', can: 'Also approves lab sessions and logs industry collaborations.' },
  { role: 'lab_manager', can: 'Sees everything, manages rooms, equipment and consumables, and sets other people’s roles.' },
];

export function LandingOverview() {
  return (
    <div className="mx-auto max-w-[960px] px-4 py-16 sm:px-8">
      <section id="what-you-can-do" aria-labelledby="pages-heading" className="scroll-mt-6">
        <h2 id="pages-heading" className="font-serif text-[28px] leading-tight sm:text-[32px]">
          What you can do here
        </h2>
        <p className={`mt-2 text-[15px] ${ui.muted}`}>These are the pages in the top bar once you sign in.</p>

        <ul className={`mt-6 divide-y divide-vl-line ${ui.card}`}>
          {NAV_ITEMS.filter(({ href }) => PAGES[href]).map(({ href, label, icon: Icon }) => (
            <li key={href} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-vl-accent-soft text-vl-accent-ink">
                <Icon width={22} height={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-semibold">{label}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-vl-ink-soft">{PAGES[href]}</p>
              </div>
              <Link href={href} className={`${ui.btnText} self-start sm:-mr-2`}>
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="statuses-heading" className="mt-16">
        <h2 id="statuses-heading" className="font-serif text-[28px] leading-tight sm:text-[32px]">
          Request statuses
        </h2>
        <p className={`mt-2 text-[15px] ${ui.muted}`}>
          A request usually goes from Open to Closed in this order. Only staff can change the status, and every change is
          recorded.
        </p>
        <dl className={`mt-6 divide-y divide-vl-line ${ui.card}`}>
          {Object.keys(STATUS_LABELS).map((status) => (
            <div key={status} className="flex flex-col gap-1.5 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-5">
              <dt className="sm:w-32 sm:shrink-0">
                <StatusBadge status={status} />
              </dt>
              <dd className="text-[15px] text-vl-ink-soft">{STATUS_MEANING[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="roles-heading" className="mt-16">
        <h2 id="roles-heading" className="font-serif text-[28px] leading-tight sm:text-[32px]">
          Roles
        </h2>
        <p className={`mt-2 text-[15px] ${ui.muted}`}>
          Everyone who signs in starts as a member. The lab manager changes roles on the Users page.
        </p>
        <div className={`mt-6 overflow-x-auto ${ui.card}`}>
          <table className="w-full min-w-[480px] text-left text-[15px]">
            <thead className="bg-vl-surface-2 text-sm">
              <tr>
                <th scope="col" className={`px-5 py-3 font-medium ${ui.muted}`}>
                  Role
                </th>
                <th scope="col" className={`px-5 py-3 font-medium ${ui.muted}`}>
                  What they can do
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vl-line">
              {ROLES.map(({ role, can }) => (
                <tr key={role}>
                  <td className="px-5 py-3.5 align-top whitespace-nowrap">
                    <RoleBadge role={role} />
                  </td>
                  <td className="px-5 py-3.5 text-vl-ink-soft">{can}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
