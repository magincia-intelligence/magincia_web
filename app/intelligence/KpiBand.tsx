"use client";

import { useEffect, useState } from "react";
import type { Filters, Kpis } from "@/lib/intelligence";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const intFmt = new Intl.NumberFormat("en-AU");

function Kpi({ label, current, previous, prevYear }: {
  label: string; current: number; previous: number; prevYear: number;
}) {
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : null;
  const up = (pct ?? 0) >= 0;
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-navy/60">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{intFmt.format(current)}</span>
        {pct != null && (
          <span className={`text-sm font-semibold ${up ? "text-blue" : "text-vermillion"}`}>
            {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-xs text-navy/60">vs {intFmt.format(previous)} in {prevYear}</div>
    </div>
  );
}

export default function KpiBand({ filters }: { filters: Filters }) {
  const [data, setData] = useState<Kpis | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.sector && filters.sector !== "All") params.set("sector", filters.sector);
    if (filters.region && filters.region !== "All") params.set("region", filters.region);
    if (filters.nationality && filters.nationality !== "All") params.set("nationality", filters.nationality);
    if (filters.state && filters.state !== "All") params.set("state", filters.state);
    if (filters.providerType && filters.providerType !== "All") params.set("providerType", filters.providerType);
    const ctrl = new AbortController();
    fetch(`/api/intelligence/kpis?${params}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setData(d as Kpis))
      .catch((e) => { if (e.name !== "AbortError") setData(null); });
    return () => ctrl.abort();
  }, [filters]);

  const period = data ? `${MONTHS[data.monthNum]} ${data.currentYear} · Year-to-Date` : "";
  const isPartial = data ? data.monthNum !== 12 : false;

  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-navy">International Student Volume</h2>
        <span className="text-xs text-navy/60">{period}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Kpi label="Enrolments" current={data?.enrolments.current ?? 0}
          previous={data?.enrolments.previous ?? 0} prevYear={data?.previousYear ?? 0} />
        <Kpi label="Commencements" current={data?.commencements.current ?? 0}
          previous={data?.commencements.previous ?? 0} prevYear={data?.previousYear ?? 0} />
      </div>
      {data && isPartial && (
        <div className="mt-4 border-t border-navy/10 pt-3 text-xs text-navy/60">
          Projected full year ({data.currentYear}), on the current trajectory:{" "}
          <span className="font-semibold text-navy">~{intFmt.format(data.enrolments.projected)}</span> enrolments ·{" "}
          <span className="font-semibold text-navy">~{intFmt.format(data.commencements.projected)}</span> commencements
        </div>
      )}
    </div>
  );
}
