import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Domestic Education — Australian Education Intelligence",
  description:
    "Australian domestic education data — enrolments, attainment, and participation across higher education and VET. In development.",
  alternates: { canonical: "/intelligence/domestic-education" },
};

export default function DomesticEducationPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-navy/50">
        In development
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">
        Domestic Education
      </h1>
      <p className="mt-4 text-lg leading-snug text-navy/80">
        The home-market context for Australia’s international sector: domestic
        enrolments, attainment, and participation across higher education and VET.
      </p>

      <div className="mt-8 rounded-2xl border border-navy/10 bg-white/60 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/70">Planned coverage</h2>
        <ul className="mt-3 space-y-2 text-sm text-navy/70">
          <li>· Domestic higher education and VET enrolments over time</li>
          <li>· Attainment and participation by field and cohort</li>
          <li>· Domestic vs international balance by sector and provider</li>
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
