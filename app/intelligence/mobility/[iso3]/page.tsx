import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  formatValue,
  getAuNationality,
  getCountryReport,
  getSupplyDemandSeries,
  TOP_SOURCE_MARKETS,
  type AxisScore,
  type CountryReport,
  type IndexPoint,
  type IndicatorReport,
} from "@/lib/mobility";
import KpiBand from "@/app/intelligence/KpiBand";
import ComparisonModule from "@/app/intelligence/ComparisonModule";
import CountryEnrolmentTrend from "@/app/intelligence/mobility/CountryEnrolmentTrend";
import SupplyDemandIndexChart from "@/app/intelligence/mobility/SupplyDemandIndexChart";

// Rebuild at most daily; the underlying indicators change a few times a year.
export const revalidate = 86400;
// Pre-render the major source markets; any other ISO3 renders on demand (ISR).
export const dynamicParams = true;

export function generateStaticParams() {
  return TOP_SOURCE_MARKETS.map((m) => ({ iso3: m.iso3.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ iso3: string }>;
}): Promise<Metadata> {
  const { iso3 } = await params;
  const report = await getCountryReport(iso3).catch(() => null);
  if (!report) return {};
  const name = report.country.name;
  const title = `${name} — International Student Mobility Report`;
  const description = `Supply and demand indicators for international student mobility from ${name}: education quality, tertiary capacity, outbound mobility, GDP per capita, and youth population — benchmarked globally.`;
  const canonical = `/intelligence/mobility/${iso3.toLowerCase()}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: `https://magincia.ai${canonical}`,
      siteName: "Magincia Intelligence",
      images: [{ url: "/magincia_banner.png", width: 1983, height: 793 }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/magincia_banner.png"] },
  };
}

const INDICATOR_BLURB: Record<string, string> = {
  EDU_INDEX: "UNDP education sub-index (schooling years).",
  PISA_MATH: "OECD PISA mean score — mathematics.",
  PISA_READ: "OECD PISA mean score — reading.",
  PISA_SCI: "OECD PISA mean score — science.",
  TERTIARY_GER: "Tertiary gross enrolment ratio — domestic capacity.",
  OUTBOUND_MOBILITY: "Tertiary students studying abroad, as a share of enrolment.",
  GDP_PCAP_PPP: "GDP per capita, PPP — ability to pay.",
  YOUTH_15_24: "Population aged 15–24 — the demand pool.",
};

const CODE_LABEL: Record<string, string> = {
  EDU_INDEX: "Education Index",
  PISA_MATH: "PISA — Mathematics",
  PISA_READ: "PISA — Reading",
  PISA_SCI: "PISA — Science",
  TERTIARY_GER: "Tertiary Enrolment Ratio",
  OUTBOUND_MOBILITY: "Outbound Mobility Ratio",
  GDP_PCAP_PPP: "GDP per Capita (PPP)",
  YOUTH_15_24: "Youth Population (15–24)",
};

function ScoreBadge({ score, accent }: { score: number | null; accent: string }) {
  return (
    <span
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-base font-semibold text-cream"
      style={{ backgroundColor: score === null ? "#9aa5b1" : accent }}
    >
      {score ?? "—"}
    </span>
  );
}

function IndicatorRow({ item, accent }: { item: IndicatorReport; accent: string }) {
  const pct = item.score ?? 0;
  return (
    <li className="py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="font-medium text-navy">{CODE_LABEL[item.code] ?? item.name}</span>
          <span className="ml-2 text-xs text-navy/50">{item.year}</span>
        </div>
        <div className="flex items-baseline gap-3 whitespace-nowrap">
          <span className="text-sm font-semibold tabular-nums text-navy">
            {formatValue(item.value, item.unit)}
          </span>
          <ScoreBadge score={item.score} accent={accent} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/10">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
        </div>
        <span className="w-28 shrink-0 text-right text-xs text-navy/50">
          {item.score === null ? "no rank" : `${item.score}th pctile`}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-navy/55">
        {INDICATOR_BLURB[item.code]}
        {item.regionAvg !== null && (
          <span className="text-navy/40">
            {" "}· region avg {formatValue(item.regionAvg, item.unit)}
          </span>
        )}
      </p>
    </li>
  );
}

function AxisCard({
  title,
  subtitle,
  items,
  score,
  accent,
}: {
  title: string;
  subtitle: string;
  items: IndicatorReport[];
  score: AxisScore;
  accent: string;
}) {
  return (
    <section className="rounded-2xl border border-navy/10 bg-white/70 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <p className="mt-1 text-sm text-navy/60">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums" style={{ color: accent }}>
            {score.score ?? "—"}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-navy/50">
            over {score.nPresent}/{score.nTotal} indic.
          </div>
        </div>
      </div>
      {items.length ? (
        <ul className="mt-3 divide-y divide-navy/10">
          {items.map((i) => (
            <IndicatorRow key={i.code} item={i} accent={accent} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-navy/60">No indicators available for this country.</p>
      )}
    </section>
  );
}

const BLUE = "#1E487A";
const VERMILLION = "#EA401C";

export default async function MobilityCountryPage({
  params,
}: {
  params: Promise<{ iso3: string }>;
}) {
  const { iso3 } = await params;
  let report: CountryReport | null = null;
  let auNationality: string | null = null;
  let indexSeries: IndexPoint[] = [];
  try {
    [report, auNationality, indexSeries] = await Promise.all([
      getCountryReport(iso3),
      getAuNationality(iso3).catch(() => null),
      getSupplyDemandSeries(iso3).catch(() => []),
    ]);
  } catch (err) {
    console.error("mobility country report failed:", err);
  }
  if (!report) notFound();

  const { country, supply, demand, coverage, supplyScore, demandScore } = report;
  const tags = [country.region, country.incomeGroup, country.isNativeEnglish ? "Native English" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <Link
        href="/intelligence/mobility"
        className="text-sm text-blue transition-colors hover:text-vermillion"
      >
        ← Mobility country reports
      </Link>

      <header className="mt-6 border-b border-navy/10 pb-6">
        <span className="inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
          Mobility Country Report
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          {country.name}
        </h1>
        {tags && <p className="mt-3 text-sm uppercase tracking-wide text-navy/60">{tags}</p>}
        <p className="mt-4 max-w-3xl text-lg leading-snug text-navy/80">
          Two forces shape how many students a country sends abroad: the{" "}
          <span className="font-semibold text-blue">supply</span> of domestic education (quality and
          capacity at home) and the{" "}
          <span className="font-semibold text-vermillion">demand</span> drivers (who wants to leave,
          and who can afford to). Each indicator is scored 0–100 by its global percentile.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AxisCard
          title="Supply — domestic education"
          subtitle="Higher scores = stronger home system. Weak supply itself drives students abroad."
          items={supply}
          score={supplyScore}
          accent={BLUE}
        />
        <AxisCard
          title="Demand — drivers to study abroad"
          subtitle="Outbound appetite, ability to pay, and the size of the youth cohort."
          items={demand}
          score={demandScore}
          accent={VERMILLION}
        />
      </div>

      {indexSeries.length >= 2 && (
        <section className="mt-8 rounded-2xl border border-navy/10 bg-white/70 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-navy">Supply &amp; demand over time</h2>
            <span className="text-xs text-navy/50">
              {indexSeries[0].year}–{indexSeries[indexSeries.length - 1].year}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-navy/60">
            Each axis indexed 0–100 by its position <span className="font-medium">relative to the world that year</span>,
            so a rising line means {country.name} is climbing the global ranks. A widening gap between
            demand (above) and supply (below) signals growing pressure to study abroad.
          </p>
          <div className="mt-4">
            <SupplyDemandIndexChart points={indexSeries} />
          </div>
          <p className="mt-2 text-xs text-navy/50">
            Index basket (held constant for comparability): supply = Education Index + tertiary
            enrolment ratio; demand = GDP per capita (PPP) + outbound mobility ratio.
          </p>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-navy/10 bg-white/60 p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/70">Coverage</h2>
        <p className="mt-2 text-sm text-navy/70">
          {coverage.nPresent}/{coverage.nTotal} indicators present.{" "}
          {coverage.missing.length > 0 ? (
            <>
              Missing:{" "}
              <span className="text-navy/60">
                {coverage.missing.map((c) => CODE_LABEL[c] ?? c).join(", ")}
              </span>
              . Missing data is never zero-filled — PISA covers only ~80 economies and is triennial.
            </>
          ) : (
            <>Full coverage across all eight indicators.</>
          )}
        </p>
      </section>

      {auNationality && (
        <section className="mt-12">
          <div className="border-b border-navy/10 pb-4">
            <span className="inline-flex items-center rounded-full bg-blue px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
              Revealed Demand — Australia
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              {country.name} students in Australia
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-navy/70">
              The supply/demand model above is global. Here is the realised outcome in one
              destination — actual enrolments of {auNationality} students in Australia, the same
              series shown in{" "}
              <Link className="text-blue hover:text-vermillion" href="/intelligence/international-education">
                International Education
              </Link>
              , filtered to this country.
            </p>
          </div>

          <div className="mt-6">
            <KpiBand filters={{ nationality: auNationality }} />
          </div>

          <div className="mt-6 rounded-xl border border-navy/10 bg-white/70 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-navy">
              Enrolments by year{" "}
              <span className="font-normal text-navy/60">— year-to-date path, last six years</span>
            </h3>
            <div className="mt-4">
              <CountryEnrolmentTrend nationality={auNationality} />
            </div>
            <p className="mt-2 text-xs text-navy/55">
              Current year in <span className="font-semibold text-vermillion">vermillion</span>; prior
              years in grey. Source: Australian Department of Education.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ComparisonModule
              title="By Sector"
              dimension="sector"
              measure="enrolments"
              filters={{ nationality: auNationality }}
            />
            <ComparisonModule
              title="By State & Territory"
              dimension="state"
              measure="enrolments"
              filters={{ nationality: auNationality }}
            />
          </div>
        </section>
      )}

      <footer className="mt-12 border-t border-navy/10 pt-6 text-sm text-navy/60">
        <p>
          <span className="font-semibold text-navy/70">Method:</span> latest available observation
          per indicator; each scored by polarity-aware global percentile across all countries. Axis
          scores average only the indicators that are present (denominator shown), so gaps are not
          imputed.
        </p>
        <p className="mt-3">
          <span className="font-semibold text-navy/70">Sources:</span>{" "}
          <a className="text-blue hover:text-vermillion" href="https://data.worldbank.org">
            World Bank Open Data
          </a>{" "}
          (CC BY 4.0) ·{" "}
          <a className="text-blue hover:text-vermillion" href="https://uis.unesco.org">
            UNESCO Institute for Statistics
          </a>{" "}
          ·{" "}
          <a className="text-blue hover:text-vermillion" href="https://hdr.undp.org">
            UNDP Human Development Report Office
          </a>
          . Australian enrolment outcomes are covered separately in{" "}
          <Link className="text-blue hover:text-vermillion" href="/intelligence/international-education">
            International Education
          </Link>
          .
        </p>
        <p className="mt-3 text-xs text-navy/45">
          Preview — an evolving model of mobility supply and demand. Indicator weights are not a
          forecast.
        </p>
      </footer>
    </main>
  );
}
