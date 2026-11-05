// components/LoginIllustration.tsx — the picture above the sign-in card: an arched doorway with the lab's vase.
import { VaseMark } from '@/components/icons';

export function LoginIllustration() {
  return (
    <div className="relative mx-auto h-28 w-24" aria-hidden>
      {/* floating bits */}
      <span className="absolute top-3 -left-4 h-3 w-3 rotate-12 rounded-sm bg-[#f9ab00]" />
      <span className="absolute top-10 -right-5 h-2.5 w-2.5 rounded-full bg-[#34a853]" />
      <span className="absolute top-1 -right-2 h-2 w-2 rotate-45 bg-[#ea4335]" />
      {/* the arch */}
      <div className="absolute inset-x-0 top-0 bottom-3 flex items-center justify-center rounded-t-full border-[6px] border-[#1558b0] bg-[#1f2a44] text-[#a8c7fa] dark:border-[#a8c7fa] dark:bg-[#0b1426]">
        <VaseMark width={36} height={36} />
      </div>
      {/* the doorstep */}
      <div className="absolute inset-x-1.5 bottom-0 h-3 -skew-x-12 rounded-sm bg-[#81c995] dark:bg-[#34a853]" />
    </div>
  );
}
