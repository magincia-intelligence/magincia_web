import { Pool } from "pg";

// Same pooled connection as lib/intelligence.ts (shared via globalThis).
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

function getPool(): Pool {
  if (!globalForPg._pgPool) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("SUPABASE_DB_URL is not set");
    }
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

// National Planning Level — new overseas student commencements (NOSCs) per
// calendar year, Higher Education + VET. Sources: Dept of Education managed
// growth factsheets (2025: 270,000; 2026: 295,000, set 4 Aug 2025; 2027:
// 295,000, confirmed Jul 2026).
export const NPL_TARGETS: Record<number, number> = {
  2025: 270000,
  2026: 295000,
  2027: 295000,
};

// One month of year-to-date commencements, Higher Education + VET only (the
// sectors the NPL covers). `upper` = all HE+VET commencements; `lower` = those
// flagged new to Australia. NOSCs (the NPL measure, recorded in PRISMS and not
// published) fall between the two — see the methodology on the page.
export type NplPoint = {
  year: number;
  month: number;
  upper: number;
  lower: number;
  he: number;
  vet: number;
};

export async function getNplSeries(fromYear = 2023): Promise<NplPoint[]> {
  const { rows } = await getPool().query(
    `select year, month_num as month,
       sum(ytd_commencements)::int as upper,
       sum(ytd_commencements) filter (where new_to_australia = 'Yes')::int as lower,
       sum(ytd_commencements) filter (where sector = 'Higher Education')::int as he,
       sum(ytd_commencements) filter (where sector = 'VET')::int as vet
     from gold.mart_enrolments_explorer
     where sector in ('Higher Education', 'VET') and year >= $1
     group by year, month_num
     order by year, month_num`,
    [fromYear],
  );
  return rows.map((r) => ({
    year: Number(r.year),
    month: Number(r.month),
    upper: Number(r.upper),
    lower: Number(r.lower),
    he: Number(r.he),
    vet: Number(r.vet),
  }));
}
