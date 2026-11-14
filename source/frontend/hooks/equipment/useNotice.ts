// hooks/equipment/useNotice.ts — the message at the bottom of the page; it disappears by itself after a few seconds.
import { useEffect, useState } from 'react';

export function useNotice() {
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  return [notice, setNotice] as const;
}