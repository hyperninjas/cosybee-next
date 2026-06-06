const TABS = ["Energy", "Solar", "Heating", "Insulation", "S"];

/** Underlined Energy/Solar/Heating/Insulation tab row. */
export default function PhoneTabs({ active = "Energy" }: { active?: string }) {
  return (
    <div className="mt-3 flex items-end gap-3 border-b border-border px-4 text-[10px] text-muted">
      {TABS.map((t) =>
        t === active ? (
          <span
            key={t}
            className="-mb-px border-b-2 border-[#2563EB] pb-1.5 font-semibold text-link"
          >
            {t}
          </span>
        ) : (
          <span key={t} className="pb-1.5">
            {t}
          </span>
        ),
      )}
    </div>
  );
}
