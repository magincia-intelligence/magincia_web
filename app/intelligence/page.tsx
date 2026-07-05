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

// Ad-hoc analysis: dated, one-off charted write-ups over a data release, distinct
// from the evergreen interactive tools above. Newest first.
type Report = {
  href: string;
  kind: string;      // eyebrow: "Release Analysis", "Case Study", …
  date: string;      // display date, e.g. "5 Jul 2026"
  title: string;
  dek: string;       // one-line summary
};

const REPORTS: Report[] = [
  {
    href: "/intelligence/international-education-may-2026",
    kind: "Release Analysis",
    date: "5 Jul 2026",
    title: "The boom has turned — May 2026",
    dek: "The first year-on-year decline of the post-pandemic era: enrolments −7.6%, commencements −8.0%, concentrated in VET, ELICOS and the pathway source markets.",
  },
  {
    href: "/intelligence/sa-commencement-anomaly",
    kind: "Case Study",
    date: "12 Jun 2026",
    title: "The South Australian commencement anomaly",
    dek: "How the Adelaide University merger inflated a statistic — research commencements jumped tenfold while genuine new arrivals fell.",
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

      <section className="mt-16 sm:mt-20">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-navy/50">
          Latest analysis
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-navy/60">
          Dated deep-dives into individual data releases — the story behind the numbers.
        </p>
        <ul className="mt-6 divide-y divide-navy/10 border-y border-navy/10">
          {REPORTS.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <div className="flex shrink-0 items-center gap-2 sm:w-52">
                  <time className="text-sm tabular-nums text-navy/60">{r.date}</time>
                  <span className="text-xs font-semibold uppercase tracking-widest text-vermillion">
                    {r.kind}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-lg font-semibold text-navy transition-colors group-hover:text-vermillion">
                    {r.title}
                    <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                  <p className="mt-1 text-sm text-navy/70">{r.dek}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
