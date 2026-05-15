/** Energy performance certificate card: D→B rating + £ breakdown + footer. */
export default function EpcCard() {
  return (
    <div className="mx-3 mt-2.5 rounded-md border border-neutral-200 p-2">
      <p className="mb-2 text-[10px] font-bold text-black">
        Energy performance certificate
      </p>

      <div className="mb-2 flex items-center justify-center gap-2 rounded bg-neutral-50 py-2">
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#F97316] text-xs font-bold text-white">
            D
          </div>
          <span className="mt-0.5 text-[6px] text-neutral-500">
            Current rating
          </span>
        </div>
        <span className="text-xs text-neutral-400">→</span>
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#22C55E] text-xs font-bold text-white">
            B
          </div>
          <span className="mt-0.5 text-[6px] text-neutral-500">Potential</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="rounded border border-neutral-200 px-1 py-1">
          <p className="text-[8px] font-bold text-black">£1,890/yr</p>
          <p className="text-[6px] text-neutral-500">Current</p>
        </div>
        <div className="rounded border border-neutral-200 px-1 py-1">
          <p className="text-[8px] font-bold text-black">£1,490/yr</p>
          <p className="text-[6px] text-neutral-500">Potential</p>
        </div>
        <div className="rounded bg-[#FEF6C7] px-1 py-1">
          <p className="text-[8px] font-bold text-[#15803D]">£400/yr</p>
          <p className="text-[6px] text-[#15803D]">Save</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[7px] text-neutral-500">
        <span>
          Last EPC: <span className="font-medium text-black">Feb 2025</span>
        </span>
        <span className="font-medium text-[#2563EB]">Update profile →</span>
      </div>
    </div>
  );
}
