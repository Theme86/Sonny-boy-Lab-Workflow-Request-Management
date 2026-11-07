// components/users/ErrorAlert.tsx — the red message above the list when it could not be loaded.
export function ErrorAlert({ message }: { message: string }) {
  return (
    <p role="alert" className="m-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
      {message}
    </p>
  );
}
