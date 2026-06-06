const ITEMS = [
  { label: "Home", active: true },
  { label: "Insights", active: false },
  { label: "Settings", active: false },
  { label: "More", active: false },
];

/** Bottom tab bar with active state. */
export default function PhoneBottomNav() {
  return (
    <div className="mt-3 flex items-center justify-around border-t border-border pt-1.5 pb-1 text-[7px]">
      {ITEMS.map((it) => (
        <div
          key={it.label}
          className="flex flex-col items-center gap-0.5"
          style={{ color: it.active ? "#2563EB" : "#94A3B8" }}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: it.active ? "#2563EB" : "#CBD5E1" }}
          />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
