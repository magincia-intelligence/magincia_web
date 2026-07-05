import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Market Intelligence — Australian Education",
  description:
    "Data tools across Australian education: international student enrolments, mobility country reports, domestic education, and early childhood education and care (ECEC).",
  alternates: { canonical: "/intelligence" },
};

type Section = {
  href: string;
  eyebrow: string;
  title: string;
  blurb: string;
  status: "live" | "soon";
};

const SECTIONS: Section[] = [
  {
    href: "/intelligence/international-education-may-2026",
    eyebrow: "New · Release Analysis",
    title: "The boom has turned — May 2026",
    blurb:
      "The Department of Education's May 2026 release is the first year-on-year decline of the post-pandemic era: enrolments −7.6%, commencements −8.0%, concentrated in VET and ELICOS. A charted read of what turned and why.",
    status: "live",
  },
  {
    href: "/intelligence/international-education",
    eyebrow: "Live",
    title: "International Education",
    blurb:
      "Australian international student enrolments and commencements since 2005 — by sector, source country, state, and provider, with year-on-year comparison and projection.",
    status: "live",
  },
  {
    href: "/intelligence/mobility",
    eyebrow: "Live",
    title: "Mobility Country Reports",
    blurb:
      "Per-country supply and demand for international student mobility — domestic education quality and capacity versus the drivers to study abroad, benchmarked globally.",
    status: "live",
  },
  {
    href: "/intelligence/domestic-education",
    eyebrow: "Live",
    title: "Domestic Education",
    blurb:
      "Australia's school-to-university pipeline by state — secondary retention, undergraduate applications and offers, and university commencements, completions and study load.",
    status: "live",
  },
  {
    href: "/intelligence/early-education",
    eyebrow: "In development",
    title: "Early Education (ECEC)",
    blurb:
      "Early childhood education and care — participation, provider supply, and workforce across the Australian ECEC sector.",
    status: "soon",
  },
];

export default function IntelligenceHub() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10 py-16 sm:py-24">
      <span className="inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        Market Intelligence
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">
        Australian education, in data
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-snug text-navy/80">
        Interactive tools across the education market — from international student
        flows into Australia to the supply and demand shaping global student
        mobility. Choose an area to explore.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group card-elevated flex flex-col rounded-2xl p-6"
          >
            <span
              className={`text-xs font-semibold uppercase tracking-widest ${
                s.status === "live" ? "text-vermillion" : "text-navy/40"
              }`}
            >
              {s.eyebrow}
            </span>
            <h2 className="mt-2 text-xl font-semibold text-navy sm:text-2xl">{s.title}</h2>
            <p className="mt-2 flex-1 text-sm text-navy/70">{s.blurb}</p>
            <span className="mt-4 text-sm text-blue transition-colors group-hover:text-vermillion">
              {s.status === "live" ? "Explore →" : "Preview →"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
