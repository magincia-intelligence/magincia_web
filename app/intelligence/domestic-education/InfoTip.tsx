"use client";

import { useState } from "react";

/** A small accessible info tooltip: opens on hover, keyboard focus, and tap
 *  (click toggle), so it works on desktop and touch. */
export default function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`What does “${label}” measure?`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-navy/30 text-[10px] font-semibold leading-none text-navy/55 transition-colors hover:border-vermillion hover:text-vermillion focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-20 w-64 -translate-x-1/2 rounded-lg border border-navy/15 bg-white p-3 text-xs font-normal leading-relaxed text-navy/75 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
