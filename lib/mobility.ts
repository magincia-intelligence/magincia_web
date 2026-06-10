import { Pool } from "pg";

// Share the single pg pool created in lib/intelligence.ts (same global key).
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

function getPool(): Pool {
  if (!globalForPg._pgPool) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) throw new Error("SUPABASE_DB_URL is not set");
    globalForPg._pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10_000,
      allowExitOnIdle: true,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForPg._pgPool;
}

// ---- Types --------------------------------------------------------------
export type Axis = "supply" | "demand";

export type IndicatorReport = {
  code: string;
  name: string;
  value: number;
  unit: string | null;
  year: number;
  globalPercentile: number | null; // 0..1
  score: number | null; // round(globalPercentile * 100)
  regionAvg: number | null;
};

export type AxisScore = { score: number | null; nPresent: number; nTotal: number };

export type CountryReport = {
  country: {
    iso3: string;
    name: string;
    region: string | null;
    incomeGroup: string | null;
    isNativeEnglish: boolean;
  };
  supply: IndicatorReport[];
  demand: IndicatorReport[];
  coverage: { present: string[]; missing: string[]; nPresent: number; nTotal: number };
  supplyScore: AxisScore;
  demandScore: AxisScore;
};

// The 8-indicator registry (kept in sync with mobility.dim_indicator).
export const AXIS_OF: Record<string, Axis> = {
  EDU_INDEX: "supply",
  PISA_MATH: "supply",
  PISA_READ: "supply",
  PISA_SCI: "supply",
  TERTIARY_GER: "supply",
  OUTBOUND_MOBILITY: "demand",
  GDP_PCAP_PPP: "demand",
  YOUTH_15_24: "demand",
};
const ALL_CODES = Object.keys(AXIS_OF);
const SUPPLY_TOTAL = ALL_CODES.filter((c) => AXIS_OF[c] === "supply").length;
const DEMAND_TOTAL = ALL_CODES.filter((c) => AXIS_OF[c] === "demand").length;

// ---- Query --------------------------------------------------------------
/** Build a per-country supply/demand report, or null if the country is unknown. */
export async function getCountryReport(iso3: string): Promise<CountryReport | null> {
  const code = iso3.trim().toUpperCase();
  const pool = getPool();

  const meta = await pool.query(
    `select iso3, country_name, region, income_group, is_native_english
       from mobility.dim_country where iso3 = $1`,
    [code],
  );
  if (meta.rowCount === 0) return null;
  const m = meta.rows[0];

  const { rows } = await pool.query(
    `select indicator_code, indicator_name, axis, unit, value, year,
            global_percentile, region_avg
       from mobility.vw_country_indicator_report
      where iso3 = $1
      order by axis, indicator_code`,
    [code],
  );

  const supply: IndicatorReport[] = [];
  const demand: IndicatorReport[] = [];
  const present = new Set<string>();

  for (const r of rows) {
    present.add(r.indicator_code);
    const pct = r.global_percentile === null ? null : Number(r.global_percentile);
    const item: IndicatorReport = {
      code: r.indicator_code,
      name: r.indicator_name,
      value: Number(r.value),
      unit: r.unit,
      year: Number(r.year),
      globalPercentile: pct,
      score: pct === null ? null : Math.round(pct * 100),
      regionAvg: r.region_avg === null ? null : Number(r.region_avg),
    };
    (r.axis === "supply" ? supply : demand).push(item);
  }

  const mean = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
  const sScores = supply.map((i) => i.score).filter((s): s is number => s !== null);
  const dScores = demand.map((i) => i.score).filter((s): s is number => s !== null);

  return {
    country: {
      iso3: m.iso3.trim(),
      name: m.country_name,
      region: m.region,
      incomeGroup: m.income_group,
      isNativeEnglish: m.is_native_english,
    },
    supply,
    demand,
    coverage: {
      present: [...present].sort(),
      missing: ALL_CODES.filter((c) => !present.has(c)),
      nPresent: present.size,
      nTotal: ALL_CODES.length,
    },
    supplyScore: { score: mean(sScores), nPresent: sScores.length, nTotal: SUPPLY_TOTAL },
    demandScore: { score: mean(dScores), nPresent: dScores.length, nTotal: DEMAND_TOTAL },
  };
}

// Major source markets for Australian international education — featured on the
// mobility index and pre-rendered. (Any ISO3 in dim_country also resolves.)
export const TOP_SOURCE_MARKETS: { iso3: string; name: string }[] = [
  { iso3: "CHN", name: "China" },
  { iso3: "IND", name: "India" },
  { iso3: "NPL", name: "Nepal" },
  { iso3: "VNM", name: "Vietnam" },
  { iso3: "PHL", name: "Philippines" },
  { iso3: "COL", name: "Colombia" },
  { iso3: "IDN", name: "Indonesia" },
  { iso3: "THA", name: "Thailand" },
  { iso3: "PAK", name: "Pakistan" },
  { iso3: "BRA", name: "Brazil" },
  { iso3: "LKA", name: "Sri Lanka" },
  { iso3: "KOR", name: "Korea, Rep." },
];

// ---- Supply/demand index over time --------------------------------------
export type IndexPoint = { year: number; supply: number | null; demand: number | null };

/**
 * Supply & demand index (0–100) per year for a country, from the fixed-core-
 * basket view. Each axis is the mean percentile of its core indicators scored
 * against the world that year, so the line tracks the country's changing
 * position relative to peers. Returns one point per year (supply/demand may be
 * null where that axis's core basket is incomplete that year).
 */
export async function getSupplyDemandSeries(iso3: string): Promise<IndexPoint[]> {
  const code = iso3.trim().toUpperCase();
  const { rows } = await getPool().query(
    `select v.year_key as year, v.axis, v.index_score
       from mobility.vw_country_axis_index v
       join mobility.dim_country d on d.country_key = v.country_key
      where d.iso3 = $1
      order by v.year_key`,
    [code],
  );
  const byYear = new Map<number, IndexPoint>();
  for (const r of rows) {
    const y = Number(r.year);
    if (!byYear.has(y)) byYear.set(y, { year: y, supply: null, demand: null });
    const p = byYear.get(y)!;
    if (r.axis === "supply") p.supply = Number(r.index_score);
    else p.demand = Number(r.index_score);
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

/**
 * Resolve an ISO3 to the AU DoE nationality label (via the bridge), but only if
 * that label actually has enrolment data in the gold mart. Returns null when the
 * country is not an AU source market (so the AU section is hidden).
 */
export async function getAuNationality(iso3: string): Promise<string | null> {
  const code = iso3.trim().toUpperCase();
  const { rows } = await getPool().query(
    `select nr.nationality
       from reference.nationality_region nr
      where nr.iso3 = $1
        and exists (
          select 1 from gold.mart_enrolments_explorer e
          where e.nationality = nr.nationality
        )
      order by nr.nationality
      limit 1`,
    [code],
  );
  return rows.length ? (rows[0].nationality as string) : null;
}

// ---- Value formatting ---------------------------------------------------
const intFmt = new Intl.NumberFormat("en-AU");

/** Human-friendly rendering of a raw indicator value, by unit. */
export function formatValue(value: number, unit: string | null): string {
  const u = (unit ?? "").toLowerCase();
  if (u.includes("index")) return value.toFixed(3);
  if (u === "%") return `${value.toFixed(1)}%`;
  if (u === "score") return Math.round(value).toString();
  if (u.includes("intl")) return `$${intFmt.format(Math.round(value))}`;
  if (u.includes("person")) {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return intFmt.format(Math.round(value));
  }
  return intFmt.format(value);
}
