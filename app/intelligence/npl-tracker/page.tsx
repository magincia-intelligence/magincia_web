import type { Metadata } from "next";
import Link from "next/link";
import NplTracker from "@/app/intelligence/NplTracker";
import { getNplSeries, NPL_TARGETS, type NplPoint } from "@/lib/npl";

export const metadata: Metadata = {
  title: "National Planning Level Tracker — International Student Commencements",
  description:
    "Tracks Australia's year-to-date international student commencements against the National Planning Level (295,000 new overseas student commencements in 2026), with an adjustable full-year projection.",
  alternates: { canonical: "/intelligence/npl-tracker" },
};

// Rebuild at most hourly; the underlying data changes ~monthly.
export const revalidate = 3600;

export default async function NplTrackerPage() {
  let series: NplPoint[] = [];
  try {
    series = await getNplSeries(2023);
  } catch (err) {
    console.error("npl tracker load failed:", err);
  }

  return (
    <main className="w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-16 sm:py-24">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        International Education
      </span>

      <h1 className="mt-6 text-3xl sm:text-5xl font-semibold tracking-tight text-navy">
        National Planning Level tracker
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-navy/80 leading-snug">
        The Government sets a National Planning Level (NPL) for the number of new international students who can
        start Higher Education or VET courses each calendar year: 270,000 in 2025 and 295,000 in 2026 and 2027.
        This tool tracks commencements so far against that level and projects the full year. Use the slider to
        test what the rest of the year would need to look like.
      </p>

      {series.length ? (
        <NplTracker series={series} targets={NPL_TARGETS} />
      ) : (
        <p className="mt-10 text-navy/70">The data is temporarily unavailable. Please try again shortly.</p>
      )}

      <section className="mt-12 max-w-3xl text-sm text-navy/75 leading-relaxed">
        <h2 className="text-xl font-semibold tracking-tight text-navy">Why a range, not a single line</h2>
        <p className="mt-3">
          The planning level counts <strong>new overseas student commencements (NOSCs)</strong>: a student starting
          their first non-exempt course at their first provider, or moving to a non-exempt course at a different
          provider. These counts are kept in the Government&rsquo;s PRISMS system and are not published. The
          Department of Education&rsquo;s monthly data counts every course start, so we show the range that the
          NOSC count must fall within:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Upper bound</strong>: all Higher Education and VET commencements. This overstates the NOSC
            count, because it also includes students moving to a new course at the same provider, and groups the
            planning level exempts, such as higher degree by research students, some scholarship holders, students
            from the Pacific and Timor-Leste, and (from 2026) students moving from an Australian school or a
            pathway provider.
          </li>
          <li>
            <strong>Lower bound</strong>: Higher Education and VET commencements by students the Department flags
            as <em>new to Australia</em>. All of these count as NOSCs, but students already in Australia who start
            with a new provider also count, so the true figure is higher.
          </li>
        </ul>
        <p className="mt-3">
          ELICOS, schools and non-award courses are excluded from both bounds, as they are from the planning level.
          The tool also shows where the planning level sits within the range, and compares that with the
          previous year. This tells you whether the target is relatively harder or easier to reach than last year,
          without having to guess the exact NOSC count.
        </p>

        <h2 className="mt-8 text-xl font-semibold tracking-tight text-navy">How the projection works</h2>
        <p className="mt-3">
          Each remaining month adds the commencements recorded in the same month of the previous year, adjusted by
          the assumed change. By default that change matches each bound&rsquo;s year-to-date trend; the slider
          applies one assumption to both bounds. Because so much of the year&rsquo;s intake happens in February and
          July, the projection becomes much firmer after each of those intakes.
        </p>

        <h2 className="mt-8 text-xl font-semibold tracking-tight text-navy">Sources</h2>
        <p className="mt-3">
          Commencements: Department of Education,{" "}
          <a className="text-vermillion hover:underline"
            href="https://www.education.gov.au/international-education-data-and-research/international-student-monthly-summary-and-data-tables">
            international student monthly data
          </a>{" "}
          (year-to-date, all-data release), modelled in the magincia warehouse. Planning levels and NOSC
          definition: Department of Education,{" "}
          <a className="text-vermillion hover:underline"
            href="https://www.education.gov.au/download/19308/factsheet-managed-growth-international-education-arrangement-2026/41736/document/pdf">
            Managed growth for international education: 2026 arrangements
          </a>{" "}
          and{" "}
          <a className="text-vermillion hover:underline" href="https://www.education.gov.au/managed-system-international-education">
            A managed system for international education
          </a>. The planning level is a guide for visa-processing priority, not a hard cap on visas.
        </p>
      </section>
    </main>
  );
}
