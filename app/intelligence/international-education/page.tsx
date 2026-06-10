import type { Metadata } from "next";
import Link from "next/link";
import EnrolmentsExplorer from "@/app/intelligence/EnrolmentsExplorer";
import { getFilterOptions, getSeries, type FilterOptions, type SeriesPoint } from "@/lib/intelligence";

export const metadata: Metadata = {
  title: "International Education — Australian International Student Enrolments",
  description:
    "Interactive visualisation of Australian international student enrolments and commencements over time, filterable by sector, source country, state, and provider type.",
  alternates: { canonical: "/intelligence/international-education" },
};

// Rebuild at most hourly; the underlying data changes ~monthly.
export const revalidate = 3600;

export default async function InternationalEducationPage() {
  let options: FilterOptions | null = null;
  let initialSeries: SeriesPoint[] = [];
  try {
    [options, initialSeries] = await Promise.all([getFilterOptions(), getSeries({})]);
  } catch (err) {
    console.error("international education page load failed:", err);
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-6 py-16 sm:py-24">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        International Education
      </span>

      <h1 className="mt-6 text-3xl sm:text-5xl font-semibold tracking-tight text-navy">
        International student enrolments
      </h1>
      <p className="mt-4 text-lg text-navy/80 leading-snug">
        Year-to-date enrolments and commencements for international students in
        Australia, from 2005 to the latest monthly release. Filter by sector,
        source country, state, and provider type.
      </p>

      {options ? (
        <EnrolmentsExplorer options={options} initialSeries={initialSeries} />
      ) : (
        <div className="mt-8 rounded-xl border border-navy/10 bg-white/60 p-6 text-navy/70">
          The data is temporarily unavailable. Please check back shortly.
        </div>
      )}

      <p className="mt-6 text-sm text-navy/60">
        Source:{" "}
        <a
          className="text-vermillion hover:underline"
          href="https://www.education.gov.au/international-education-data-and-research/international-student-monthly-summary-and-data-tables"
        >
          Australian Department of Education — International Student Monthly Summary
        </a>
        . Updated daily.
      </p>
    </main>
  );
}
