import Link from "next/link";
import type { Metadata } from "next";
import { TOP_SOURCE_MARKETS } from "@/lib/mobility";

export const metadata: Metadata = {
  title: "Mobility Country Reports — International Student Supply & Demand",
  description:
    "Per-country supply and demand indicators for international student mobility — education quality and capacity at home versus the drivers to study abroad, benchmarked globally.",
  alternates: { canonical: "/intelligence/mobility" },
};

export const revalidate = 86400;

export default function MobilityIndexPage() {
  const featured = TOP_SOURCE_MARKETS[0]; // China
  const rest = TOP_SOURCE_MARKETS.slice(1);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10 py-16 sm:py-20">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        Mobility Country Reports
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">
        Who sends students abroad — and why
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-snug text-navy/80">
        For every country, two forces drive international student mobility: the{" "}
        <span className="font-semibold text-blue">supply</span> of domestic education and the{" "}
        <span className="font-semibold text-vermillion">demand</span> drivers to study abroad. Each
        report benchmarks a country against the world across eight open indicators.
      </p>

      {/* Featured: China */}
      <Link
        href={`/intelligence/mobility/${featured.iso3.toLowerCase()}`}
        className="group mt-10 block rounded-2xl border border-navy/10 bg-white/70 p-6 transition-colors hover:border-vermillion/40 sm:p-8"
      >
        <div className="text-xs font-semibold uppercase tracking-widest text-vermillion">
          Featured report
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-semibold text-navy sm:text-3xl">{featured.name}</h2>
          <span className="text-sm text-blue transition-colors group-hover:text-vermillion">
            View report →
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-navy/70">
          Australia’s largest source market. See how China’s domestic education supply and its
          outbound-demand drivers compare against the world.
        </p>
      </Link>

      <h3 className="mt-12 text-sm font-semibold uppercase tracking-wide text-navy/60">
        Major source markets
      </h3>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rest.map((m) => (
          <li key={m.iso3}>
            <Link
              href={`/intelligence/mobility/${m.iso3.toLowerCase()}`}
              className="flex items-center justify-between rounded-xl border border-navy/10 bg-white/60 px-4 py-3 text-navy transition-colors hover:border-vermillion/40 hover:text-vermillion"
            >
              <span className="font-medium">{m.name}</span>
              <span className="text-xs text-navy/40">{m.iso3}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-navy/60">
        Reports exist for every country with available data (any ISO 3166-1 alpha-3 code resolves,
        e.g. <code className="text-navy/70">/intelligence/mobility/deu</code>). Sources: World Bank
        (CC BY 4.0), UNESCO UIS, and UNDP HDRO.
      </p>
    </main>
  );
}
