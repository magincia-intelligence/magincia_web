import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatLongDate, getAllBriefs, getBrief } from "@/lib/briefs";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBriefs().map((b) => ({ date: b.date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const brief = getBrief(date);
  if (!brief) return {};
  return {
    title: `${brief.meta.weekday}, ${formatLongDate(brief.meta.date)} — Daily Brief`,
    description: "Daily Brief — Australian Education, from Magincia Intelligence.",
  };
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const brief = getBrief(date);
  if (!brief) notFound();

  const { meta, body } = brief;
  const dateline = [
    [meta.weekday, formatLongDate(meta.date)].filter(Boolean).join(", "),
    meta.time,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="w-full max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="text-sm text-blue hover:text-vermillion transition-colors"
      >
        ← All briefs
      </Link>

      <header className="mt-6 mb-10 border-b border-navy/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold text-navy">
          {meta.title}
        </h1>
        {dateline && (
          <p className="mt-2 text-sm uppercase tracking-wide text-navy/60">
            {dateline}
          </p>
        )}
      </header>

      <article className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {body}
        </ReactMarkdown>
      </article>
    </main>
  );
}
