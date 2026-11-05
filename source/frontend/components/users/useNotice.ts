// components/users/useNotice.ts — a short message that disappears by itself after a few seconds.
import { useEffect, useState } from 'react';

export function useNotice(ms = 5000) {
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), ms);
    return () => clearTimeout(t);
  }, [notice, ms]);
  return { notice, setNotice, dismissNotice: () => setNotice('') };
}
