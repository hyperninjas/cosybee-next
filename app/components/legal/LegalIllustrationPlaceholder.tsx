/**
 * Generic shield-with-checkmark illustration used as a stand-in until
 * the real brand illustration is wired up. Sized via className.
 */
export default function LegalIllustrationPlaceholder({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Illustration placeholder"
      className={`${className} relative flex h-44 w-44 items-center justify-center rounded-3xl bg-[#F5F1E0] sm:h-52 sm:w-52`}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-24 w-24 sm:h-28 sm:w-28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M32 4 L56 13 V30 C56 44 46 56 32 60 C18 56 8 44 8 30 V13 Z"
          fill="#D7C638"
          stroke="#A89A12"
          strokeWidth="2"
        />
        <path
          d="M22 33 L29 40 L43 24"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
