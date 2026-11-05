// components/users/Notice.tsx — a small message at the bottom of the screen with a "Dismiss" button.
export function Notice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded bg-[#313131] py-3.5 pr-2 pl-4 text-sm text-[#f2f2f2] shadow-lg sm:left-6 sm:translate-x-0 dark:bg-vl-ink dark:text-[#313131]"
    >
      <span>{message}</span>
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
