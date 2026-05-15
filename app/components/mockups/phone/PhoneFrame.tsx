import { type ReactNode } from "react";

/**
 * Base iPhone-style chrome: outer black frame, dynamic-island notch, and
 * the 9:41 + cellular/wifi/battery status bar. Children render below the
 * status bar inside a white rounded interior.
 */
export default function PhoneFrame({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${className} rounded-[2rem] bg-[#1a1a1a] p-[2px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)]`}
    >
      <div className="relative overflow-hidden rounded-[1.9rem] bg-white pb-2">
        {/* dynamic island */}
        <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black" />

        {/* status bar */}
        <div className="flex items-center justify-between px-4 pt-1 text-[10px] font-semibold text-black">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-[7px] w-[8px] rounded-[1px] bg-black" />
            <span className="inline-block h-[7px] w-[8px] rounded-[1px] bg-black" />
            <span className="inline-block h-[7px] w-3 rounded-[1px] border border-black" />
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}
