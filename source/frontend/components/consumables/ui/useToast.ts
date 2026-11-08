// components/consumables/ui/useToast.ts — a short message that hides itself after a few seconds.
import { useEffect, useRef, useState } from 'react';

const TOAST_MS = 2500;

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function show(text: string) {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), TOAST_MS);
  }

  return { message, show };
}
