import CosybeeMark from "../../ui/CosybeeMark";

/** "Good Morning" + cosybee logo row used at the top of every phone mock. */
export default function PhoneGreeting() {
  return (
    <div className="mt-3 flex items-center justify-between px-4">
      <span className="text-sm font-bold text-foreground">Good Morning</span>
      <div className="flex items-center gap-1">
        <CosybeeMark className="h-3 w-auto" />
        <span className="text-[10px] font-medium text-muted">
          cosybee<sup className="text-[6px]">®</sup>
        </span>
      </div>
    </div>
  );
}
