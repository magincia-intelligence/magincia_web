import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  formatLongDate,
  formatMonthLabel,
  getBriefsByMonth,
} from "@/lib/briefs";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBriefsByMonth().map((m) => ({ month: m.month }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string }>;
}): Promise<Metadata> {
  const { month } = await params;
  const label = formatMonthLabel(month);
  const title = `Australian Education Daily Briefs — ${label}`;
  return {
    title,
    description: `All Magincia Intelligence daily briefs from ${label} on Australian education and international education in Australia.`,
    alternates: { canonical: `/archive/${month}` },
  };
}

export default async function MonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const group = getBriefsByMonth().find((m) => m.month === month);
  if (!group) notFound();

  return (
    <main className="w-full max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/archive"
        className="text-sm text-blue hover:text-vermillion transition-colors"
      >
        ← All months
      </Link>

      <header className="mt-6 mb-10 border-b border-navy/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold text-navy">
          {group.label}
        </h1>
        <p className="mt-2 text-navy/70">
          {group.briefs.length} brief{group.briefs.length === 1 ? "" : "s"}
        </p>
      </header>

      <ul className="border-t border-navy/10">
        {group.briefs.map((b) => (
          <li key={b.date} className="border-b border-navy/10">
            <Link href={`/briefs/${b.date}`} className="group block py-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold text-navy transition-colors group-hover:text-vermillion">
                  {[b.weekday, formatLongDate(b.date)].filter(Boolean).join(", ")}
                </span>
                <span className="shrink-0 text-sm text-navy/50">{b.time}</span>
              </div>
              {b.summary && (
                <p className="mt-2 text-navy/75 leading-snug">{b.summary}</p>
              )}
              <span className="mt-2 inline-block text-sm font-medium text-blue transition-colors group-hover:text-vermillion">
                Read more →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
