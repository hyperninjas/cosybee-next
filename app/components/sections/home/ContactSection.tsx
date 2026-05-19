"use client";

import { useState } from "react";
import Hexagon from "../../ui/Hexagon";

function EnvelopeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-12 w-12"
      aria-hidden
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  );
}

/**
 * Contact section — dark backdrop with a decorative olive hex behind
 * the headline, a yellow hex email card, and a 3-field form. Sits at
 * the bottom of the home page and mirrors the dark/Hero styling used
 * elsewhere on the site.
 *
 * The form is a controlled client component for state only; submit is
 * a no-op until you wire it to your backend / Vercel Forms / etc.
 */
export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire to server action / API route / Vercel Form handler
    console.log({ name, email, message });
  };

  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      <div className="relative mx-auto max-w-360 px-6 py-20 sm:px-10 lg:px-30 lg:py-25">
        {/* decorative side hexes bleeding in from left + right */}
        <Hexagon
          color="#7A6F1C"
          className="pointer-events-none absolute -left-40 top-100 -z-10 w-80 -translate-y-1/2 sm:-left-44 sm:w-lg"
        />
        <Hexagon
          color="#4A5F7A"
          className="pointer-events-none absolute -right-40 top-12 -z-10 w-72 sm:-right-44 sm:w-96"
        />

        {/* headline + decorative hex behind it */}
        <div className="relative flex flex-col items-center">
          <Hexagon
            color="#7A6F1C"
            className="pointer-events-none absolute left-1/2 top-15 -z-10 w-72 -translate-x-1/2 -translate-y-1/2 sm:w-75"
          />
          <h2 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-[96px]">
            contact
          </h2>
          <p className="mt-2 text-base text-neutral-200 sm:text-lg">
            we&rsquo;d love to hear from you!
          </p>
        </div>

        {/* email card */}
        <div className="mt-16 flex flex-col items-center">
          <Hexagon
            color="#EFDF18"
            className="flex w-32 items-center justify-center sm:w-36"
          >
            <span className="absolute inset-0 flex items-center justify-center">
              <EnvelopeIcon />
            </span>
          </Hexagon>
          <a
            href="mailto:info@energiebee.com"
            className="mt-6 text-base font-medium text-white transition-colors hover:text-[#EFDF18] sm:text-lg"
          >
            info@energiebee.com
          </a>
        </div>

        {/* form */}
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-16 flex max-w-295 flex-col gap-5"
        >
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-full bg-white px-7 py-5 text-base text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#EFDF18]/50"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-full bg-white px-7 py-5 text-base text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#EFDF18]/50"
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full resize-none rounded-3xl bg-white px-7 py-5 text-base text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#EFDF18]/50"
          />
          <button
            type="submit"
            className="w-full rounded-full border border-[#EFDF18] bg-transparent px-7 py-5 text-base font-semibold text-white transition-colors hover:bg-[#EFDF18]/10 sm:text-lg"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
