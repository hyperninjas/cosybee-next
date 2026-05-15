type Rating = {
  letter: string;
  range: string;
  color: string;
  width: string;
  badge?: { label: string; text: string; bgColor: string; textColor: string };
};

const RATINGS: Rating[] = [
  { letter: "A", range: "92+", color: "#16A34A", width: "28%" },
  {
    letter: "B",
    range: "81-91",
    color: "#65A30D",
    width: "38%",
    badge: {
      label: "POTENTIAL",
      text: "B 83",
      bgColor: "#DCFCE7",
      textColor: "#16A34A",
    },
  },
  { letter: "C", range: "69-80", color: "#A3D055", width: "48%" },
  {
    letter: "D",
    range: "55-68",
    color: "#F97316",
    width: "58%",
    badge: {
      label: "CURRENT",
      text: "D 64",
      bgColor: "#FFEDD5",
      textColor: "#EA580C",
    },
  },
  { letter: "E", range: "39-54", color: "#EA580C", width: "72%" },
  { letter: "F", range: "21-38", color: "#DC2626", width: "86%" },
  { letter: "G", range: "1-20", color: "#B91C1C", width: "100%" },
];

/** A–G horizontal rating bars with optional POTENTIAL / CURRENT badges. */
export default function RatingBars() {
  return (
    <div className="mx-3 mt-2.5 space-y-[3px]">
      {RATINGS.map((r) => (
        <div
          key={r.letter}
          className="grid grid-cols-[12px_1fr_44px] items-center gap-2"
        >
          <span className="text-[9px] font-bold text-black">{r.letter}</span>
          <div className="relative h-3.5">
            <div
              className="flex h-full items-center rounded-sm pl-1.5 text-[7px] font-bold text-white"
              style={{ backgroundColor: r.color, width: r.width }}
            >
              {r.range}
            </div>
          </div>
          <div className="flex flex-col items-end leading-none">
            {r.badge && (
              <>
                <span className="text-[5px] font-bold tracking-wide text-neutral-500">
                  {r.badge.label}
                </span>
                <span
                  className="mt-0.5 rounded px-1 py-[2px] text-[7px] font-bold"
                  style={{
                    backgroundColor: r.badge.bgColor,
                    color: r.badge.textColor,
                  }}
                >
                  {r.badge.text}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
