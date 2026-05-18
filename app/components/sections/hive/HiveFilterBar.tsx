"use client";

import { useState } from "react";

const CATEGORIES = [
  "All",
  "Nature Knows Best",
  "Eco Living",
  "Home & Living",
  "Innovation",
];

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/**
 * Search input + horizontal category chip row. State is local (visual
 * filter only — wire to actual filtering when the article list becomes
 * data-driven).
 */
export default function HiveFilterBar() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  return (
    <div className="mx-auto max-w-360 px-6 py-12 sm:px-10 lg:px-30">
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* search */}
        <label className="relative flex w-full max-w-90.5 items-center">
          <span className="absolute left-4 text-neutral-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-neutral-200 bg-white py-3.25 pl-12 pr-4 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#EFDF18]/40"
          />
        </label>

        {/* category chips */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`rounded-full px-5 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-linear-to-r from-[#FF8B27] to-[#EE3D1A] text-white shadow-[0_8px_20px_-8px_rgba(238,61,26,0.5)]"
                    : "bg-[#F3F3F3] text-[#545454] hover:bg-neutral-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
