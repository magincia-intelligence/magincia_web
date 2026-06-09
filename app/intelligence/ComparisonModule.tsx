"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Breakdown, Filters } from "@/lib/intelligence";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const intFmt = new Intl.NumberFormat("en-AU");

type Sort = "volume" | "growth";

export default function ComparisonModule({
  title, dimension, measure, filters, topN, sortable = false, minForGrowth = 0, defaultSort = "volume",
}: {
  title: string;
  dimension: "nationality" | "state" | "sector" | "region" | "provider_type";
  measure: "enrolments" | "commencements";
  filters: Filters;
  topN?: number;
  sortable?: boolean;
  minForGrowth?: number;
  defaultSort?: Sort;
}) {
  const [data, setData] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>(defaultSort);
  const first = useRef(true);

  useEffect(() => {
    const params = new URLSearchParams({ dimension, measure });
    if (filters.sector && filters.sector !== "All") params.set("sector", filters.sector);
    if (filters.region && filters.region !== "All") params.set("region", filters.region);
    if (filters.nationality && filters.nationality !== "All") params.set("nationality", filters.nationality);
    if (filters.state && filters.state !== "All") params.set("state", filters.state);
    if (filters.providerType && filters.providerType !== "All") params.set("providerType", filters.providerType);
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/intelligence/breakdown?${params}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setData(d as Breakdown))
      .catch((e) => { if (e.name !== "AbortError") setData(null); })
      .finally(() => { setLoading(false); first.current = false; });
    return () => ctrl.abort();
  }, [dimension, measure, filters]);

  const rows = useMemo(() => {
    if (!data) return [];
    const withPct = data.rows.map((r) => ({
      ...r,
      pct: r.previous > 0 ? ((r.current - r.previous) / r.previous) * 100 : null,
    }));
    const sorted = sort === "growth"
      ? withPct.filter((r) => r.current >= minForGrowth).sort((a, b) => (b.pct ?? -Infinity) - (a.pct ?? -Infinity))
      : withPct.sort((a, b) => b.current - a.current);
    return topN ? sorted.slice(0, topN) : sorted;
  }, [data, sort, topN, minForGrowth]);

  const max = useMemo(() => Math.max(1, ...rows.map((r) => Math.max(r.current, r.previous))), [rows]);
  const period = data ? `${MONTHS[data.monthNum]} ${data.currentYear} vs ${data.previousYear} · YTD` : "";

  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        {sortable && (
          <div className="inline-flex rounded-md border border-navy/15 p-0.5 text-xs">
            {(["volume", "growth"] as Sort[]).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                className={`rounded px-2 py-0.5 font-semibold capitalize transition ${
                  sort === s ? "bg-navy text-cream" : "text-navy/60 hover:text-navy"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-0.5 text-xs text-navy/60">{period || " "}</p>

      <div className="mt-3 space-y-1.5">
        {loading && !data ? (
          <p className="py-6 text-center text-sm text-navy/60">Loading…</p>
        ) : !rows.length ? (
          <p className="py-6 text-center text-sm text-navy/60">No data for this selection.</p>
        ) : (
          rows.map((r) => {
            const curW = (r.current / max) * 100;
            const prevW = (r.previous / max) * 100;
            const up = (r.pct ?? 0) >= 0;
            return (
              <div key={r.label} className="grid grid-cols-[7.5rem_1fr_4.5rem_3.5rem] items-center gap-2 text-sm">
                <span className="truncate text-navy/80" title={r.label}>{r.label}</span>
                <div className="relative h-5 rounded bg-navy/[0.06]">
                  <div className="absolute inset-y-0 left-0 rounded bg-blue" style={{ width: `${curW}%` }} />
                  {/* prior-year marker: navy-edged cream tick — high luminance
                      contrast on both the blue bar and the light track */}
                  <div className="absolute inset-y-[-3px] w-[3px] -translate-x-1/2 rounded-sm bg-navy"
                    style={{ left: `${prevW}%` }} title={`Previous year: ${intFmt.format(r.previous)}`}>
                    <div className="absolute inset-x-[1px] inset-y-[1px] rounded-[1px] bg-cream" />
                  </div>
                </div>
                <span className="text-right tabular-nums text-navy/80">{intFmt.format(r.current)}</span>
                <span className={`text-right tabular-nums font-semibold ${r.pct == null ? "text-navy/60" : up ? "text-blue" : "text-vermillion"}`}>
                  {r.pct == null ? "new" : `${up ? "+" : ""}${r.pct.toFixed(0)}%`}
                </span>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-navy/60">
        <span className="inline-block h-2.5 w-3 rounded-sm bg-blue" /> Current year
        <span className="ml-1 inline-block h-3 w-[3px] rounded-sm bg-navy">
          <span className="block h-full w-[1px] mx-auto bg-cream" />
        </span> Previous year · % = year-on-year change
      </p>
    </div>
  );
}
