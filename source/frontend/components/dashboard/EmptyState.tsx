// components/dashboard/EmptyState.tsx — what a card shows when it has nothing yet: a small drawing, a short title,
// one line of explanation and (when there is something to do) one action.
import Link from 'next/link';
import { ui } from '@/lib/ui';
import { EmptyArt, type ArtKind } from './EmptyArt';

interface EmptyStateProps {
  art: ArtKind;
  title: string;
  body?: string;
  action?: { href: string; label: string };
}

export function EmptyState({ art, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex items-center gap-4">
      <EmptyArt kind={art} />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {body && <p className={`mt-0.5 text-sm ${ui.muted}`}>{body}</p>}
        {action && (
          <Link href={action.href} className={`mt-1 inline-block text-sm ${ui.link}`}>
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
