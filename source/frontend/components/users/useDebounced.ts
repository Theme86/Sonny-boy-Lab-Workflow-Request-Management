// components/users/useDebounced.ts — a value that follows another one after it has stopped changing for a moment.
import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
