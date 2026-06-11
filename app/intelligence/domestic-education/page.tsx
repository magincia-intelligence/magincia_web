import type { Metadata } from "next";
import Link from "next/link";
import DomesticExplorer from "./DomesticExplorer";
import { getStateMetrics, type StatePoint } from "@/lib/domestic";

export const metadata: Metadata = {
  title: "Domestic Education — Australian Education Intelligence",
  description:
    "Australian domestic education by state — school enrolments and retention, undergraduate applications and offers, and university commencements, completions and study load. Compare states and trends over time.",
  alternates: { canonical: "/intelligence/domestic-education" },
};

// Rebuild at most daily; the underlying annual data changes a few times a year.
export const revalidate = 86400;

export default async function DomesticEducationPage() {
  let points: StatePoint[] = [];
  try {
    points = await getStateMetrics();
  } catch (err) {
    console.error("domestic education page load failed:", err);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        Domestic Education
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">
        Australian domestic education, by state
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-snug text-navy/80">
        The domestic pipeline from school to university — secondary enrolments and
        retention to Year 12, undergraduate applications and offers, and university
        commencements, completions and study load. Compare states and follow the
        trends over time.
      </p>

      {points.length ? (
        <DomesticExplorer points={points} />
      ) : (
        <div className="mt-8 rounded-xl border border-navy/10 bg-white/60 p-6 text-navy/70">
          The data is temporarily unavailable. Please check back shortly.
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-navy/10 bg-white/50 p-6 text-sm leading-relaxed text-navy/65">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy/55">Notes &amp; sources</h2>
        <ul className="mt-3 space-y-1.5">
          <li>· School enrolments and apparent retention: ABS Schools (cat. 4221.0). Retention is capped at 100% and is volatile for small populations. Figures are by <strong>state of schooling</strong>.</li>
          <li>· Applications &amp; offers: Dept of Education, Undergraduate Applications &amp; Offers. A demand indicator (per-student, first semester); the QLD TAC reporting break (2019–21) is excluded from the series.</li>
          <li>· University commencements, completions and study load (EFTSL): Dept of Education Higher Education Statistics (2024). Counts are <strong>input-perturbed</strong> (indicative) and by <strong>institution location</strong>, not student home state — a student studying interstate appears under the institution&apos;s state.</li>
          <li>· All sources licensed CC BY 4.0.</li>
        </ul>
      </div>
    </main>
  );
}
