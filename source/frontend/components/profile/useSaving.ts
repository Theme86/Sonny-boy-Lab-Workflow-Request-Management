// components/profile/useSaving.ts — runs a save, tracking "Saving…" and the error message if it fails.
import { useState } from 'react';

export function useSaving() {
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function run(job: () => Promise<void>) {
    setFormError('');
    setSaving(true);
    try {
      await job();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Your profile could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return { formError, saving, run };
}
