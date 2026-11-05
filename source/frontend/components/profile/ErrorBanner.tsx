// components/profile/ErrorBanner.tsx — the red message above the save bar when saving failed.
export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
      {message}
    </p>
  );
}
