/** Energy performance certificate card: D→B rating + £ breakdown + footer. */
export default function EpcCard() {
  return (
    <div className="mx-3 mt-2.5 rounded-md border border-border p-2">
      <p className="mb-2 text-[10px] font-bold text-foreground">
        Energy performance certificate
      </p>

      <div className="mb-2 flex items-center justify-center gap-2 rounded bg-background py-2">
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#F97316] text-xs font-bold text-white">
            D
          </div>
          <span className="mt-0.5 text-[6px] text-muted">
            Current rating
          </span>
        </div>
        <span className="text-xs text-muted">→</span>
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#22C55E] text-xs font-bold text-white">
            B
          </div>
          <span className="mt-0.5 text-[6px] text-muted">Potential</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="rounded border border-border px-1 py-1">
          <p className="text-[8px] font-bold text-foreground">£1,890/yr</p>
          <p className="text-[6px] text-muted">Current</p>
        </div>
        <div className="rounded border border-border px-1 py-1">
          <p className="text-[8px] font-bold text-foreground">£1,490/yr</p>
          <p className="text-[6px] text-muted">Potential</p>
        </div>
        <div className="rounded bg-warning-soft px-1 py-1">
          <p className="text-[8px] font-bold text-success">£400/yr</p>
          <p className="text-[6px] text-success">Save</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[7px] text-muted">
        <span>
          Last EPC: <span className="font-medium text-foreground">Feb 2025</span>
        </span>
        <span className="font-medium text-link">Update profile →</span>
      </div>
    </div>
  );
}
