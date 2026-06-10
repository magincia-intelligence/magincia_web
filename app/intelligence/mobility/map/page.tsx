import Link from "next/link";
import type { Metadata } from "next";
import { getIndexMapData, type IndexMapData } from "@/lib/mobility";
import { getWorldMap } from "@/lib/worldmap";
import WorldIndexMap from "@/app/intelligence/mobility/WorldIndexMap";

export const metadata: Metadata = {
  title: "World Map — Student Mobility Supply & Demand Over Time",
  description:
    "A world choropleth of the international student mobility supply and demand index, by year — see how every country's position relative to the world has shifted over time.",
  alternates: { canonical: "/intelligence/mobility/map" },
};

export const revalidate = 86400;

export default async function MobilityMapPage() {
  const map = getWorldMap();
  let data: IndexMapData | null = null;
  try {
    data = await getIndexMapData();
  } catch (err) {
    console.error("mobility map data failed:", err);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <Link href="/intelligence/mobility" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Mobility country reports
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        World Map
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">
        Supply &amp; demand across the world, over time
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-snug text-navy/80">
        Each country is shaded by its mobility{" "}
        <span className="font-semibold text-blue">supply</span> or{" "}
        <span className="font-semibold text-vermillion">demand</span> index for the chosen year —
        its position <span className="font-medium">relative to the world</span>, 0 (low) to 100
        (high). Drag the slider or press play to watch two decades of change.
      </p>

      <div className="mt-8">
        {data && data.years.length ? (
          <WorldIndexMap map={map} data={data} />
        ) : (
          <div className="rounded-xl border border-navy/10 bg-white/60 p-6 text-navy/70">
            The map data is temporarily unavailable. Please check back shortly.
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-navy/60">
        Index basket (held constant for comparability): supply = Education Index + tertiary enrolment
        ratio; demand = GDP per capita (PPP) + outbound mobility ratio + population, each scored
        against all reporting countries that year. Sources: World Bank (CC BY 4.0), UNESCO UIS, UNDP HDRO.
        Geometry: Natural Earth via world-atlas.
      </p>
    </main>
  );
}
