import { Pool } from "pg";
import type { StatePoint, FieldDemand } from "@/lib/domestic-meta";

// Re-export the client-safe metadata so server code has a single import surface.
export * from "@/lib/domestic-meta";

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

/** Every by-state metric point. The view is small (~1k rows); we ship the lot
 *  and let the client pivot/select interactively. National = stateCode 'AUS';
 *  HE 'MULTI' (Multi-State) is excluded — not a geographic jurisdiction. */
export async function getStateMetrics(): Promise<StatePoint[]> {
  const sql = `
    select ref_year, state_code, state_name, metric, unit, value
    from education.vw_state_metrics
    where state_code <> 'MULTI' and value is not null
    order by metric, ref_year, state_code`;
  const { rows } = await getPool().query(sql);
  return rows.map((r) => ({
    year: Number(r.ref_year),
    stateCode: r.state_code,
    stateName: r.state_name,
    metric: r.metric,
    unit: r.unit,
    value: Number(r.value),
  }));
}

/** National undergraduate applications & offers by broad Field of Education for
 *  the latest available year. National only — the source does not publish
 *  state × field, so this is a standalone panel, not crossable with the
 *  by-state view. */
export async function getFieldDemand(): Promise<FieldDemand | null> {
  const sql = `
    select ref_year, field_of_education, applications, offers, offer_rate
    from education.vw_ug_applications_offers_by_field
    where ref_year = (select max(ref_year) from education.vw_ug_applications_offers_by_field)
      and applications is not null
    order by applications desc`;
  const { rows } = await getPool().query(sql);
  if (!rows.length) return null;
  return {
    year: Number(rows[0].ref_year),
    rows: rows.map((r) => ({
      field: r.field_of_education,
      applications: Number(r.applications),
      offers: Number(r.offers),
      offerRate: Number(r.offer_rate),
    })),
  };
}
