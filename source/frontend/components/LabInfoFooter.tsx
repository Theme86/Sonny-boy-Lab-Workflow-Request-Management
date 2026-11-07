// components/LabInfoFooter.tsx — lab hours, safety rules and "report a problem" under the sign-in card.
// Shows only what has been configured in lib/labInfo.ts; renders nothing when none of it is set.
import { labInfo as configured, reportProblemHref, type LabInfo } from '@/lib/labInfo';
import { ui } from '@/lib/ui';

export function LabInfoFooter({ info = configured }: { info?: LabInfo }) {
  const { hours, contactEmail, rulesUrl } = info;
  if (!hours && !contactEmail && !rulesUrl) return null;

  return (
    <footer className={`mt-6 flex max-w-[420px] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs ${ui.muted}`}>
      {hours && (
        <span>
          <span className="font-medium">Lab hours</span> {hours}
        </span>
      )}
      {rulesUrl && (
        <a href={rulesUrl} target="_blank" rel="noopener noreferrer" className={ui.link}>
          Lab safety rules
        </a>
      )}
      {contactEmail && (
        <a href={reportProblemHref(contactEmail)} className={ui.link}>
          Report a problem
        </a>
      )}
    </footer>
  );
}
