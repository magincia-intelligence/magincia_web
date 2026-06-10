import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";
import type { FeatureCollection } from "geojson";
import topo from "world-atlas/countries-110m.json";

// Server-only: build projected SVG country paths once, keyed by ISO3, so the
// client map component stays free of d3/topojson/world-atlas.

export type CountryShape = { iso3: string; name: string; d: string };
export type WorldMap = { width: number; height: number; shapes: CountryShape[] };

const WIDTH = 960;
const HEIGHT = 500;
// world-atlas names that i18n-iso-countries can't resolve to ISO3 but we want.
const NAME_OVERRIDE: Record<string, string> = { Kosovo: "XKX" };
// Drop from the map (no data, distorts the projection fit).
const DROP = new Set(["ATA"]); // Antarctica

let cache: WorldMap | null = null;

export function getWorldMap(): WorldMap {
  if (cache) return cache;

  const fc = feature(
    topo as unknown as Parameters<typeof feature>[0],
    (topo as unknown as { objects: { countries: object } }).objects.countries as never,
  ) as unknown as FeatureCollection;

  const resolved = fc.features
    .map((f) => {
      const name = (f.properties as { name?: string } | null)?.name ?? "";
      const iso3 =
        NAME_OVERRIDE[name] ??
        countries.numericToAlpha3(String(f.id ?? "").padStart(3, "0")) ??
        null;
      return { f, name, iso3 };
    })
    .filter((x): x is { f: (typeof fc.features)[number]; name: string; iso3: string } =>
      Boolean(x.iso3) && !DROP.has(x.iso3 as string),
    );

  const projection = geoNaturalEarth1();
  projection.fitExtent(
    [
      [4, 4],
      [WIDTH - 4, HEIGHT - 4],
    ],
    { type: "FeatureCollection", features: resolved.map((x) => x.f) } as FeatureCollection,
  );
  const path = geoPath(projection);

  const shapes: CountryShape[] = [];
  for (const { f, name, iso3 } of resolved) {
    const d = path(f as never);
    if (d) shapes.push({ iso3, name, d });
  }

  cache = { width: WIDTH, height: HEIGHT, shapes };
  return cache;
}
