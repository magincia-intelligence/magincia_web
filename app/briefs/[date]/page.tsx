import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  briefTags,
  formatLongDate,
  getAllBriefs,
  getBrief,
  parseBrief,
} from "@/lib/briefs";
import BriefBody from "./BriefBody";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBriefs().map((b) => ({ date: b.date }));
}

const DEFAULT_DESC =
  "Daily briefing on Australian education and international education in Australia — policy, funding, regulation, and sector commentary across higher ed, VET, ELICOS, schools, and ECEC.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const brief = getBrief(date);
  if (!brief) return {};
  const { meta } = brief;
  const longDate = formatLongDate(meta.date);
  const title = `Australian Education Daily Brief — ${meta.weekday}, ${longDate}`;
  const description = meta.summary || DEFAULT_DESC;
  const canonical = `/briefs/${meta.date}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: `https://magincia.ai${canonical}`,
      publishedTime: `${meta.date}T00:00:00+10:00`,
      modifiedTime: `${meta.date}T00:00:00+10:00`,
      authors: ["Magincia Intelligence"],
      siteName: "Magincia Intelligence",
      images: [{ url: "/magincia_banner.png", width: 1983, height: 793 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/magincia_banner.png"],
    },
  };
}

function aestIsoDateTime(date: string, time: string): string {
  // time looks like "21:06 AEST" or "05:11 AEST"; fall back to 00:00 if absent
  const m = time.match(/(\d{1,2}):(\d{2})/);
  const hh = m ? m[1].padStart(2, "0") : "00";
  const mm = m ? m[2] : "00";
  return `${date}T${hh}:${mm}:00+10:00`;
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
  const sections = parseBrief(body);
  const tags = briefTags(sections);
  const longDate = formatLongDate(meta.date);
  const dateline = [
    [meta.weekday, longDate].filter(Boolean).join(", "),
    meta.time,
  ]
    .filter(Boolean)
    .join(" · ");

  const publishedIso = aestIsoDateTime(meta.date, meta.time);
  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: `Australian Education Daily Brief — ${meta.weekday}, ${longDate}`,
    description: meta.summary || DEFAULT_DESC,
    datePublished: publishedIso,
    dateModified: publishedIso,
    inLanguage: "en-AU",
    isAccessibleForFree: true,
    url: `https://magincia.ai/briefs/${meta.date}`,
    image: "https://magincia.ai/magincia_banner.png",
    articleSection: "Australian education",
    keywords: [
      "Australian education",
      "international education in Australia",
      "higher education policy",
      "ATEC",
      "TEQSA",
      "ASQA",
      "ELICOS",
      "VET",
    ].join(", "),
    author: { "@type": "Organization", name: "Magincia Intelligence" },
    publisher: {
      "@type": "Organization",
      name: "Magincia Intelligence",
      logo: {
        "@type": "ImageObject",
        url: "https://magincia.ai/magincia_logo.png",
      },
    },
  };

  return (
    <main className="w-full max-w-3xl mx-auto px-6 sm:px-8 lg:px-10 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
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
        {meta.summary && (
          <p className="mt-4 text-lg text-navy/80 leading-snug">
            {meta.summary}
          </p>
        )}
      </header>

      <BriefBody sections={sections} tags={tags} />
    </main>
  );
}
