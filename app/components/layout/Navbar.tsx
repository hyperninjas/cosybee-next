"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "smart", href: "/smart" },
  { label: "heating", href: "/heating" },
  { label: "solar", href: "/solar" },
  { label: "energy", href: "/energy" },
  { label: "hive", href: "/hive" },
  { label: "learn", href: "/learn" },
  // { label: "shop", href: "/shop" },
];

const MENU_ID = "site-mobile-menu";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="57"
      height="40"
      viewBox="0 0 57 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M56.3939 18.6717L51.9995 11.0611C51.527 10.2428 50.6459 9.73384 49.7009 9.73384H40.9131C40.5227 9.73384 40.1435 9.82205 39.7987 9.98124C39.7602 9.61825 39.6487 9.26236 39.4611 8.9379L35.0667 1.32725C34.5942 0.508999 33.7131 0 32.7681 0H23.9802C23.0352 0 22.1541 0.508999 21.6816 1.32725L17.2872 8.9379C17.0996 9.26236 16.9881 9.61926 16.9496 9.98226C16.6048 9.82205 16.2256 9.73485 15.8352 9.73485H7.0474C6.10241 9.73485 5.22129 10.2439 4.7488 11.0621L0.354373 18.6728C-0.118124 19.491 -0.118124 20.508 0.354373 21.3272L4.7488 28.9379C5.22129 29.7561 6.10241 30.2651 7.0474 30.2651H15.8352C16.2256 30.2651 16.6048 30.1769 16.9496 30.0177C16.9881 30.3807 17.0996 30.7366 17.2872 31.0621L21.6816 38.6727C22.1541 39.491 23.0352 40 23.9802 40H32.7681C33.7131 40 34.5942 39.491 35.0667 38.6727L39.4611 31.0621C39.6487 30.7376 39.7602 30.3807 39.7987 30.0188C40.1435 30.179 40.5217 30.2662 40.9131 30.2662H49.7009C50.6459 30.2662 51.527 29.7572 51.9995 28.9389L56.3939 21.3283C56.8664 20.51 56.8664 19.493 56.3939 18.6738V18.6717ZM18.1663 9.44487L22.5607 1.83422C22.8527 1.32826 23.3972 1.01394 23.9812 1.01394H32.7691C33.3531 1.01394 33.8976 1.32826 34.1896 1.83422L38.584 9.44487C38.876 9.95082 38.876 10.5795 38.584 11.0854L34.1896 18.6961C33.9493 19.1128 33.5376 19.3987 33.0743 19.4869C32.9739 19.4748 32.8725 19.4677 32.7691 19.4677H23.9812C23.8788 19.4677 23.7774 19.4748 23.676 19.4869C23.2127 19.3987 22.801 19.1128 22.5607 18.6961L18.1663 11.0854C17.8743 10.5795 17.8743 9.95082 18.1663 9.44487ZM7.04842 29.2492C6.46439 29.2492 5.9199 28.9349 5.62788 28.4289L1.23346 20.8183C0.941445 20.3123 0.941445 19.6836 1.23346 19.1777L5.62788 11.567C5.9199 11.0611 6.46439 10.7468 7.04842 10.7468H15.8362C16.4203 10.7468 16.9648 11.0611 17.2568 11.567L21.6512 19.1777C21.9432 19.6836 21.9432 20.3123 21.6512 20.8183L17.2568 28.4289C16.9648 28.9349 16.4203 29.2492 15.8362 29.2492H7.04842ZM38.583 30.5531L34.1886 38.1638C33.8966 38.6697 33.3521 38.984 32.7681 38.984H23.9802C23.3962 38.984 22.8517 38.6697 22.5597 38.1638L18.1653 30.5531C17.8733 30.0471 17.8733 29.4185 18.1653 28.9125L22.5597 21.3019C22.8 20.8852 23.2117 20.5992 23.675 20.511C23.7754 20.5232 23.8768 20.5303 23.9802 20.5303H32.7681C32.8705 20.5303 32.9719 20.5232 33.0733 20.511C33.5366 20.5992 33.9483 20.8852 34.1886 21.3019L38.583 28.9125C38.875 29.4185 38.875 30.0471 38.583 30.5531ZM55.5158 20.8193L51.1214 28.4299C50.8294 28.9359 50.2849 29.2502 49.7009 29.2502H40.9131C40.329 29.2502 39.7845 28.9359 39.4925 28.4299L35.0981 20.8193C34.8061 20.3133 34.8061 19.6847 35.0981 19.1787L39.4925 11.5681C39.7845 11.0621 40.329 10.7478 40.9131 10.7478H49.7009C50.2849 10.7478 50.8294 11.0621 51.1214 11.5681L55.5158 19.1787C55.8079 19.6847 55.8079 20.3133 55.5158 20.8193Z"
        fill="#C7B734"
      />
      <path
        d="M23.6588 26.0583H32.8127C33.0925 26.0583 33.3197 25.8312 33.3197 25.5513C33.3197 25.2715 33.0925 25.0443 32.8127 25.0443H23.6588C23.379 25.0443 23.1519 25.2715 23.1519 25.5513C23.1519 25.8312 23.379 26.0583 23.6588 26.0583Z"
        fill="#C7B734"
      />
      <path
        d="M32.8127 32.6489H23.6588C23.379 32.6489 23.1519 32.876 23.1519 33.1559C23.1519 33.4357 23.379 33.6629 23.6588 33.6629H32.8127C33.0925 33.6629 33.3197 33.4357 33.3197 33.1559C33.3197 32.876 33.0925 32.6489 32.8127 32.6489Z"
        fill="#C7B734"
      />
      <path
        d="M35.5868 28.7959H20.8847C20.6048 28.7959 20.3777 29.0231 20.3777 29.3029C20.3777 29.5828 20.6048 29.8099 20.8847 29.8099H35.5868C35.8667 29.8099 36.0938 29.5828 36.0938 29.3029C36.0938 29.0231 35.8667 28.7959 35.5868 28.7959Z"
        fill="#C7B734"
      />
    </svg>
  );
}

// function SearchIcon() {
//   return (
//     <svg
//       width="20"
//       height="20"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       aria-hidden="true"
//     >
//       <circle cx="11" cy="11" r="7" />
//       <path d="m20 20-3.5-3.5" />
//     </svg>
//   );
// }

// function UserIcon() {
//   return (
//     <svg
//       width="20"
//       height="20"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       aria-hidden="true"
//     >
//       <circle cx="12" cy="8" r="4" />
//       <path d="M4 21c0-4.418 3.582-7 8-7s8 2.582 8 7" />
//     </svg>
//   );
// }

/**
 * Hamburger that morphs into an X when `open`. Both states share the same
 * three <line>s so the transition is a pure transform — no layout reads,
 * GPU-cheap, and motion-reduce-friendly.
 */
function MenuToggleIcon({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <line
        x1="4"
        y1="4"
        x2="16"
        y2="4"
        stroke="#C7B734"
        strokeWidth="1.4"
        strokeLinecap="round"
        className={`origin-center transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-y-1.5 rotate-45" : ""
        }`}
        style={{ transformBox: "fill-box" }}
      />
      <line
        x1="1"
        y1="10"
        x2="19"
        y2="10"
        stroke="#C7B734"
        strokeWidth="1.4"
        strokeLinecap="round"
        className={`origin-center transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
          open ? "scale-x-0 opacity-0" : ""
        }`}
        style={{ transformBox: "fill-box" }}
      />
      <line
        x1="4"
        y1="16"
        x2="16"
        y2="16"
        stroke="#C7B734"
        strokeWidth="1.4"
        strokeLinecap="round"
        className={`origin-center transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "-translate-y-1.5 -rotate-45" : ""
        }`}
        style={{ transformBox: "fill-box" }}
      />
    </svg>
  );
}

export default function Navbar({
  activeHref,
}: {
  /** Optional override. When omitted, the active link is derived from
   *  the current URL via `usePathname()`. */
  activeHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentPath = activeHref ?? pathname;

  // A link is active when its href exactly matches the current path or
  // is a prefix of it (so `/solar/details` still highlights "solar").
  const isLinkActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  // Close on Escape; only mount the listener while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-black text-white">
      <nav className="relative mx-auto flex h-16 max-w-360 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-30">
        <Link href="/" aria-label="Cosybee home" className="shrink-0">
          <Logo className="h-12 w-auto lg:h-14" />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex xl:gap-12">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-[15px] font-medium tracking-wide transition-colors hover:text-white ${
                    isActive ? "text-white" : "text-[#B3B3B3]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 text-neutral-200 sm:gap-6">
          {/* <button
            type="button"
            aria-label="Search"
            className="hidden text-neutral-200 transition-colors hover:text-white sm:inline-flex"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            aria-label="Account"
            className="hidden text-neutral-200 transition-colors hover:text-white sm:inline-flex"
          >
            <UserIcon />
          </button> */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-md transition-colors hover:bg-white/5 lg:hidden"
          >
            <MenuToggleIcon open={open} className="h-9 w-7" />
          </button>
        </div>

        {/* Mobile menu panel — absolutely positioned below the header so it
            overlays content rather than pushing it down. Animated via
            transform + opacity only, which the compositor can run off-thread
            (no layout / paint per frame). */}
        <div
          id={MENU_ID}
          aria-hidden={!open}
          className={`absolute inset-x-0 top-full origin-top border-t border-neutral-800 bg-black/95 backdrop-blur shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] lg:hidden
            transition-[opacity,transform] duration-300 ease-out
            motion-reduce:transition-none
            ${
              open
                ? "opacity-100 translate-y-0"
                : "pointer-events-none -translate-y-3 opacity-0"
            }`}
          style={{ willChange: "transform, opacity" }}
        >
          <ul className="flex flex-col gap-1 px-4 py-4 sm:px-6">
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? 0 : -1}
                    className={`block rounded-md px-2 py-2 text-base font-medium tracking-wide transition-colors hover:bg-white/5 hover:text-white ${
                      isActive ? "text-white" : "text-[#B3B3B3]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            {/* <li className="mt-2 flex items-center gap-6 border-t border-neutral-800 px-2 pt-4 sm:hidden">
              <button
                type="button"
                aria-label="Search"
                tabIndex={open ? 0 : -1}
                className="text-neutral-200 transition-colors hover:text-white"
              >
                <SearchIcon />
              </button>
              <button
                type="button"
                aria-label="Account"
                tabIndex={open ? 0 : -1}
                className="text-neutral-200 transition-colors hover:text-white"
              >
                <UserIcon />
              </button>
            </li> */}
          </ul>
        </div>
      </nav>
    </header>
  );
}
