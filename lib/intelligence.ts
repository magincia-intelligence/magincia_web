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

// ---- Breakdown: current period vs same month prior year, by dimension ----
export type BreakdownRow = { label: string; current: number; previous: number };
export type Breakdown = {
  monthNum: number;
  currentYear: number;
  previousYear: number;
  rows: BreakdownRow[];
};

const DIM_COL: Record<string, string> = {
  nationality: "nationality", state: "state", sector: "sector", region: "region",
};
const MEASURE_COL: Record<Measure, string> = {
  enrolments: "ytd_enrolments", commencements: "ytd_commencements",
};
type Measure = "enrolments" | "commencements";

/**
 * For the latest YTD month, totals by `dimension` for the current year and the
 * same month one year earlier. The dimension's own filter is ignored (so the
 * full breakdown shows); all other filters apply.
 */
export async function getBreakdown(
  dimension: string, measure: Measure, filters: Filters,
): Promise<Breakdown> {
  const dimCol = DIM_COL[dimension];
  const measCol = MEASURE_COL[measure];
  if (!dimCol || !measCol) throw new Error("invalid dimension/measure");
  const pool = getPool();

  const latest = await pool.query(
    `select year, month_num from gold.mart_enrolments_explorer order by reporting_date desc limit 1`);
  const currentYear = Number(latest.rows[0].year);
  const monthNum = Number(latest.rows[0].month_num);
  const previousYear = currentYear - 1;

  const conds: string[] = [];
  const params: (string | number)[] = [];
  const add = (col: string, val?: string | null) => {
    if (val && val !== "All") { params.push(val); conds.push(`${col} = $${params.length}`); }
  };
  add("sector", dimension === "sector" ? null : filters.sector);
  add("region", dimension === "region" ? null : filters.region);
  add("nationality", dimension === "nationality" ? null : filters.nationality);
  add("state", dimension === "state" ? null : filters.state);
  add("provider_type", filters.providerType);

  params.push(monthNum); const pMn = params.length;
  params.push(currentYear); const pCur = params.length;
  params.push(previousYear); const pPrev = params.length;

  const where = `month_num = $${pMn} and year in ($${pCur}, $${pPrev})`
    + (conds.length ? " and " + conds.join(" and ") : "");
  const sql = `
    select ${dimCol} as label,
           sum(case when year = $${pCur} then ${measCol} else 0 end)::bigint as current,
           sum(case when year = $${pPrev} then ${measCol} else 0 end)::bigint as previous
    from gold.mart_enrolments_explorer
    where ${where}
    group by ${dimCol}`;
  const { rows } = await pool.query(sql, params);
  return {
    monthNum, currentYear, previousYear,
    rows: rows.map((r) => ({ label: r.label, current: Number(r.current), previous: Number(r.previous) })),
  };
}

// ---- Headline KPIs: latest YTD totals vs same month prior year -----------
export type Kpis = {
  monthNum: number;
  currentYear: number;
  previousYear: number;
  enrolments: { current: number; previous: number; projected: number };
  commencements: { current: number; previous: number; projected: number };
};

export async function getKpis(filters: Filters): Promise<Kpis> {
  const pool = getPool();
  const latest = await pool.query(
    `select year, month_num from gold.mart_enrolments_explorer order by reporting_date desc limit 1`);
  const currentYear = Number(latest.rows[0].year);
  const monthNum = Number(latest.rows[0].month_num);
  const previousYear = currentYear - 1;

  const conds: string[] = [];
  const params: (string | number)[] = [];
  const add = (col: string, val?: string | null) => {
    if (val && val !== "All") { params.push(val); conds.push(`${col} = $${params.length}`); }
  };
  add("sector", filters.sector);
  add("region", filters.region);
  add("nationality", filters.nationality);
  add("state", filters.state);
  add("provider_type", filters.providerType);
  params.push(monthNum); const pMn = params.length;
  params.push(currentYear); const pCur = params.length;
  params.push(previousYear); const pPrev = params.length;
  const where = `month_num = $${pMn} and year in ($${pCur}, $${pPrev})`
    + (conds.length ? " and " + conds.join(" and ") : "");
  const sql = `
    select
      sum(case when year = $${pCur} then ytd_enrolments else 0 end)::bigint     as enr_cur,
      sum(case when year = $${pPrev} then ytd_enrolments else 0 end)::bigint    as enr_prev,
      sum(case when year = $${pCur} then ytd_commencements else 0 end)::bigint  as com_cur,
      sum(case when year = $${pPrev} then ytd_commencements else 0 end)::bigint as com_prev
    from gold.mart_enrolments_explorer
    where ${where}`;
  const { rows } = await pool.query(sql, params);
  const r = rows[0] ?? {};
  const enrCur = Number(r.enr_cur || 0), enrPrev = Number(r.enr_prev || 0);
  const comCur = Number(r.com_cur || 0), comPrev = Number(r.com_prev || 0);

  // Full-year projection: scale the current YTD-at-month total by the average
  // historical (December YTD / same-month YTD) ratio over recent prior years.
  const pParams: (string | number)[] = [];
  const pConds: string[] = [];
  const padd = (col: string, val?: string | null) => {
    if (val && val !== "All") { pParams.push(val); pConds.push(`${col} = $${pParams.length}`); }
  };
  padd("sector", filters.sector);
  padd("region", filters.region);
  padd("nationality", filters.nationality);
  padd("state", filters.state);
  padd("provider_type", filters.providerType);
  pParams.push(currentYear); const ppCur = pParams.length;
  pParams.push(monthNum); const ppMn = pParams.length;
  const projSql = `
    select avg(dec_e::numeric / nullif(mon_e, 0)) as fe,
           avg(dec_c::numeric / nullif(mon_c, 0)) as fc
    from (
      select year,
        sum(case when month_num = 12 then ytd_enrolments else 0 end)        as dec_e,
        sum(case when month_num = $${ppMn} then ytd_enrolments else 0 end)  as mon_e,
        sum(case when month_num = 12 then ytd_commencements else 0 end)     as dec_c,
        sum(case when month_num = $${ppMn} then ytd_commencements else 0 end) as mon_c
      from gold.mart_enrolments_explorer
      where year < $${ppCur} and year >= $${ppCur} - 6 and month_num in (12, $${ppMn})
      ${pConds.length ? " and " + pConds.join(" and ") : ""}
      group by year
    ) t where mon_e > 0 and mon_c > 0`;
  const proj = await pool.query(projSql, pParams);
  const fe = Number(proj.rows[0]?.fe);
  const fc = Number(proj.rows[0]?.fc);
  const projEnr = monthNum === 12 || !Number.isFinite(fe) ? enrCur : Math.round(enrCur * fe);
  const projCom = monthNum === 12 || !Number.isFinite(fc) ? comCur : Math.round(comCur * fc);

  return {
    monthNum, currentYear, previousYear,
    enrolments: { current: enrCur, previous: enrPrev, projected: projEnr },
    commencements: { current: comCur, previous: comPrev, projected: projCom },
  };
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
