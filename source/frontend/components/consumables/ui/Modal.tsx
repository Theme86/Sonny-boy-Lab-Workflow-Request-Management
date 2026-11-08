// components/consumables/ui/Modal.tsx — centred pop-up with a title bar and an optional footer.
import type { ReactNode } from 'react';
import { ui } from '@/lib/ui';
import { IconButton } from './icons';
import { useOverlay } from './useOverlay';

const WIDTHS = { sm: 'sm:max-w-md', md: 'sm:max-w-2xl', lg: 'sm:max-w-3xl' };

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof WIDTHS;
};

export function Modal({ title, description, onClose, children, footer, size = 'md' }: ModalProps) {
  useOverlay(onClose, true);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative flex max-h-[94vh] w-full flex-col rounded-t-2xl bg-vl-surface shadow-xl sm:rounded-2xl ${WIDTHS[size]}`}>
        <div className={`flex items-start justify-between gap-4 border-b px-6 py-4 ${ui.border}`}>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className={`mt-0.5 text-sm ${ui.muted}`}>{description}</p>}
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className={`flex justify-end gap-2 rounded-b-2xl border-t px-6 py-3 ${ui.border}`}>{footer}</div>}
      </div>
    </div>
  );
}
