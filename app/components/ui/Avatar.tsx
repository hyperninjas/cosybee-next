import Image, { type StaticImageData } from "next/image";

/**
 * Derive a max-2-letter monogram from a name.
 * "Chris Glasser" → "CG", "Mina" → "M".
 */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Deterministic background tint per name so the same author always
 * lands on the same color. Curated to read on white-bg cards.
 */
const PALETTE = [
  "bg-[#FEF6C7] text-[#B45309]", // amber
  "bg-[#FFE4E1] text-[#C0362C]", // peach
  "bg-[#E5F2F6] text-[#1F5773]", // sky
  "bg-[#E9F4E2] text-[#3C6A2A]", // moss
  "bg-[#F1E9FC] text-[#5B2EAA]", // lilac
] as const;

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * Circular author avatar. Renders the image when `src` is provided,
 * otherwise a colored initials tile derived from the name.
 *
 * Sizing is caller-controlled via `className` (e.g. `h-10 w-10`)
 * because Tailwind's JIT can't see dynamic class names like `h-${n}`.
 */
export default function Avatar({
  src,
  avatarUrl,
  name,
  className = "h-13.5 w-13.5",
}: {
  /** Optional photo. When omitted, initials are rendered instead. */
  src?: StaticImageData | string;
  /** Optional avatar URL (alias for src, used when passing author objects). */
  avatarUrl?: string | null;
  /** Author name — used for the alt text AND the initials fallback. */
  name: string;
  /** Tailwind sizing classes (height, width). Default `h-10 w-10`. */
  className?: string;
}) {
  const imageSrc = src ?? avatarUrl;
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={name}
        width={54}
        height={54}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={`flex shrink-0 items-center justify-center rounded-full text-base font-semibold ${tintFor(name)} ${className}`}
    >
      {initialsFrom(name)}
    </div>
  );
}
