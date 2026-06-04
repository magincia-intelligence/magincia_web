import Link from "next/link";
import type { Metadata } from "next";
import { getBriefsByMonth } from "@/lib/briefs";

export const metadata: Metadata = {
  title: "Brief Archive — Australian Education Daily Briefs",
  description:
    "Browse the full archive of Magincia Intelligence daily briefs on Australian education and international education in Australia, organised by month.",
  alternates: { canonical: "/archive" },
};

export default function ArchivePage() {
  const months = getBriefsByMonth();

  return (
    <main className="w-full max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="text-sm text-blue hover:text-vermillion transition-colors"
      >
        ← Home
      </Link>

      <header className="mt-6 mb-10 border-b border-navy/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold text-navy">
          Brief Archive
        </h1>
        <p className="mt-2 text-navy/70">
          Every daily brief, organised by month.
        </p>
      </header>

      {months.length === 0 ? (
        <p className="text-navy/60">No briefs published yet.</p>
      ) : (
        <ul className="border-t border-navy/10">
          {months.map((m) => (
            <li key={m.month} className="border-b border-navy/10">
              <Link
                href={`/archive/${m.month}`}
                className="group flex items-baseline justify-between gap-4 py-5"
              >
                <span className="font-semibold text-navy transition-colors group-hover:text-vermillion">
                  {m.label}
                </span>
                <span className="shrink-0 text-sm text-navy/50">
                  {m.briefs.length} brief{m.briefs.length === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
