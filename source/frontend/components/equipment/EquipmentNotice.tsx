// components/equipment/EquipmentNotice.tsx — the message at the bottom of the page (a "snackbar").
type Props = { notice: string; onDismiss: () => void };

export function EquipmentNotice({ notice, onDismiss }: Props) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded bg-[#313131] py-3.5 pr-2 pl-4 text-sm text-[#f2f2f2] shadow-lg sm:left-6 sm:translate-x-0 dark:bg-vl-ink dark:text-[#313131]"
    >
      <span>{notice}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded px-3 py-1.5 font-medium text-[#a8c7fa] hover:bg-white/10 dark:text-[#1558b0] dark:hover:bg-black/5"
      >
        Dismiss
      </button>
    </div>
  );
}