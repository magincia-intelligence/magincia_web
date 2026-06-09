import { Pool } from "pg";

// Reuse a single pool across hot-reloads (dev) and warm lambdas (prod).
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

function getPool(): Pool {
  if (!globalForPg._pgPool) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("SUPABASE_DB_URL is not set");
    }
    globalForPg._pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Supabase pooler
      max: 3,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForPg._pgPool;
}

// ---- Types --------------------------------------------------------------
export type Filters = {
  sector?: string | null;
  region?: string | null;
  nationality?: string | null;
  state?: string | null;
  providerType?: string | null;
};

export type SeriesPoint = {
  date: string; // 'YYYY-MM-DD' (first of reporting month)
  enrolments: number;
  commencements: number;
};

export type FilterOptions = {
  sectors: string[];
  regions: string[];
  nationalities: string[];
  states: string[];
  providerTypes: string[];
};

// ---- Queries ------------------------------------------------------------
function buildWhere(f: Filters): { clause: string; params: string[] } {
  const conds: string[] = [];
  const params: string[] = [];
  const add = (col: string, val?: string | null) => {
    if (val && val !== "All") {
      params.push(val);
      conds.push(`${col} = $${params.length}`);
    }
  };
  add("sector", f.sector);
  add("region", f.region);
  add("nationality", f.nationality);
  add("state", f.state);
  add("provider_type", f.providerType);
  return { clause: conds.length ? `where ${conds.join(" and ")}` : "", params };
}

/** Time series of YTD enrolments + commencements for the given filters. */
export async function getSeries(f: Filters): Promise<SeriesPoint[]> {
  const { clause, params } = buildWhere(f);
  const sql = `
    select to_char(reporting_date, 'YYYY-MM-DD') as date,
           sum(ytd_enrolments)::bigint    as enrolments,
           sum(ytd_commencements)::bigint as commencements
    from gold.mart_enrolments_explorer
    ${clause}
    group by reporting_date
    order by reporting_date`;
  const { rows } = await getPool().query(sql, params);
  return rows.map((r) => ({
    date: r.date,
    enrolments: Number(r.enrolments),
    commencements: Number(r.commencements),
  }));
}

/** Distinct values for each filter, for populating the controls. */
export async function getFilterOptions(): Promise<FilterOptions> {
  const pool = getPool();
  const q = (sql: string) => pool.query(sql).then((r) => r.rows.map((x) => x.label as string));
  const [sectors, regions, nationalities, states, providerTypes] = await Promise.all([
    // Sectors in a sensible analytical order rather than alphabetical.
    q(`select label from bronze.dim_sector
       order by array_position(array['Higher Education','VET','ELICOS','Schools','Non-award'], label)`),
    q(`select distinct region as label from gold.mart_enrolments_explorer where region is not null`),
    q(`select label from bronze.dim_nationality where label is not null order by label`),
    q(`select label from bronze.dim_state order by label`),
    q(`select label from bronze.dim_provider_type order by label`),
  ]);
  // Order regions by where most international students come from (not alphabetical).
  const REGION_ORDER = [
    "North-East Asia", "Southern & Central Asia", "South-East Asia",
    "North Africa & Middle East", "Sub-Saharan Africa", "Americas",
    "Southern & Eastern Europe", "North-West Europe", "Oceania & Antarctica", "Other",
  ];
  regions.sort((a, b) => {
    const ia = REGION_ORDER.indexOf(a), ib = REGION_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return { sectors, regions, nationalities, states, providerTypes };
}
