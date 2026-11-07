// components/profile/view/missing.tsx — the grey text shown for an empty value ("Not provided" / an invitation to add it).
import { ui } from '@/lib/ui';

export type DetailProps = { user: import('@/lib/users').User; editable: boolean };

export const missing = (editable: boolean, text: string) => <span className={ui.muted}>{editable ? text : 'Not provided'}</span>;
