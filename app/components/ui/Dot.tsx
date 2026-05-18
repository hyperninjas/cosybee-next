/**
 * Small circular separator used between meta items (read time / date /
 * category). Default 3px (`h-0.75 w-0.75`) in the neutral `#CCC8C8`
 * tone; override via `className` for different sizes or colors.
 */
export default function Dot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 h-0.75 w-0.75 rounded-full bg-[#CCC8C8] ${className}`}
    />
  );
}
