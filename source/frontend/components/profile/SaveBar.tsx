// components/profile/SaveBar.tsx — the sticky "Cancel / Save changes" bar at the bottom of the edit page.
import Link from 'next/link';
import { ui } from '@/lib/ui';
import type { ProfileFormState } from './useProfileForm';

export function SaveBar({ form }: { form: ProfileFormState }) {
  const justSaved = form.saved && !form.hasChanges;
  return (
    <div className={`sticky bottom-4 z-10 mt-6 flex items-center justify-end gap-2 px-5 py-3 ${ui.card}`}>
      {justSaved && (
        <span role="status" className={`mr-auto text-sm ${ui.muted}`}>
          Changes saved
        </span>
      )}
      <Link href="/profile" className={ui.btnText}>
        {justSaved ? 'Done' : 'Cancel'}
      </Link>
      <button type="submit" className={ui.btnPrimary} disabled={form.saving || !form.hasChanges}>
        {form.saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
