import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Early Education (ECEC) — Australian Education Intelligence",
  description:
    "Australian early childhood education and care (ECEC) data — participation, provider supply, and workforce. In development.",
  alternates: { canonical: "/intelligence/early-education" },
};

export default function EarlyEducationPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-navy/50">
        In development
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">
        Early Education (ECEC)
      </h1>
      <p className="mt-4 text-lg leading-snug text-navy/80">
        Early childhood education and care across Australia: children’s
        participation, the supply of approved providers and places, and the ECEC
        workforce.
      </p>

      <div className="mt-8 rounded-2xl border border-navy/10 bg-white/60 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/70">Planned coverage</h2>
        <ul className="mt-3 space-y-2 text-sm text-navy/70">
          <li>· Children attending ECEC, by service type and state</li>
          <li>· Approved provider and place supply over time</li>
          <li>· Workforce size, qualifications, and shortages</li>
        </ul>
      </div>

      <p className="mt-8 text-sm text-navy/60">
        In the meantime, explore{" "}
        <Link className="text-blue hover:text-vermillion" href="/intelligence/international-education">
          International Education
        </Link>{" "}
        and{" "}
        <Link className="text-blue hover:text-vermillion" href="/intelligence/mobility">
          Mobility Country Reports
        </Link>
        .
      </p>
    </main>
  );
}
