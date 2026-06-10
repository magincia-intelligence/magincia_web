"use client";

import { useEffect, useMemo, useState } from "react";
import type { SeriesPoint } from "@/lib/intelligence";

// Compact year-comparison trend for a single source country, reusing the
// brand chart language from the main International Education explorer.
const NAVY = "#102238";
const VERM = "#EA401C";

const W = 760;
const H = 360;
const M = { top: 28, right: 96, bottom: 40, left: 56 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;
const PRIOR_YEARS = 5;
const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const intFmt = new Intl.NumberFormat("en-AU");
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

type Measure = "enrolments" | "commencements";

export default function CountryEnrolmentTrend({
  nationality,
  measure = "enrolments",
}: {
  nationality: string;
  measure?: Measure;
}) {
  const [series, setSeries] = useState<SeriesPoint[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setSeries(null);
    setError(false);
    fetch(`/api/intelligence/series?nationality=${encodeURIComponent(nationality)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setSeries(d.series as SeriesPoint[]))
      .catch((e) => { if (e.name !== "AbortError") setError(true); });
    return () => ctrl.abort();
  }, [nationality]);

  const model = useMemo(() => {
    if (!series || !series.length) return null;
    const byYear = new Map<number, number[]>();
    for (const p of series) {
      const d = new Date(p.date);
      const yr = d.getUTCFullYear();
      const mo = d.getUTCMonth() + 1;
      if (!byYear.has(yr)) byYear.set(yr, new Array(13).fill(NaN));
      byYear.get(yr)![mo] = p[measure];
    }
    const years = [...byYear.keys()].sort((a, b) => a - b);
    const maxYear = years[years.length - 1];
    const shown = years.filter((y) => y >= maxYear - PRIOR_YEARS);
    let yMax = 1;
    for (const y of shown) for (let m = 1; m <= 12; m++) {
      const v = byYear.get(y)![m];
      if (!Number.isNaN(v)) yMax = Math.max(yMax, v);
    }
    const xOf = (m: number) => M.left + ((m - 1) / 11) * innerW;
    const yOf = (v: number) => M.top + innerH - (v / yMax) * innerH;
    const lineFor = (y: number) => {
      const arr = byYear.get(y)!;
      let d = "", started = false;
      for (let m = 1; m <= 12; m++) {
        const v = arr[m];
        if (Number.isNaN(v)) continue;
        d += `${started ? "L" : "M"}${xOf(m).toFixed(1)},${yOf(v).toFixed(1)}`;
        started = true;
      }
      return d;
    };
    const endOf = (y: number) => {
      const arr = byYear.get(y)!;
      for (let m = 12; m >= 1; m--) if (!Number.isNaN(arr[m])) return { m, v: arr[m] };
      return null;
    };
    return { byYear, shown, maxYear, yMax, xOf, yOf, lineFor, endOf };
  }, [series, measure]);

  if (error) {
    return <p className="py-8 text-center text-sm text-navy/60">Couldn’t load the enrolment trend.</p>;
  }
  if (!series) {
    return <p className="py-8 text-center text-sm text-navy/60">Loading enrolment trend…</p>;
  }
  if (!model) {
    return <p className="py-8 text-center text-sm text-navy/60">No enrolment history for {nationality}.</p>;
  }

  const { shown, maxYear, yMax, xOf, yOf, lineFor, endOf } = model;
  const curEnd = endOf(maxYear);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: yMax * f, y: yOf(yMax * f) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
      aria-label={`Australian ${measure} from ${nationality}, year comparison`}>
      <rect x="0" y="0" width={W} height={H} fill="transparent" />
      {/* y gridlines + ticks */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={M.left} x2={W - M.right} y1={t.y} y2={t.y} stroke={NAVY} strokeOpacity="0.08" />
          <text x={M.left - 8} y={t.y + 4} textAnchor="end" fill={NAVY} fillOpacity="0.6" fontSize="11">{compact(t.v)}</text>
        </g>
      ))}
      {/* month axis */}
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
        <text key={m} x={xOf(m)} y={M.top + innerH + 18} textAnchor="middle" fill={NAVY} fillOpacity="0.55" fontSize="10">{MONTHS[m]}</text>
      ))}
      {/* prior-year lines */}
      {shown.filter((y) => y !== maxYear).map((y) => {
        const age = maxYear - y;
        return (
          <path key={y} d={lineFor(y)} fill="none" stroke={NAVY}
            strokeWidth="1.5" strokeOpacity={Math.max(0.12, 0.4 - age * 0.05)} strokeLinejoin="round" />
        );
      })}
      {/* current year */}
      <path d={lineFor(maxYear)} fill="none" stroke={VERM} strokeWidth="2.5" strokeLinejoin="round" />
      {/* end labels for prior years */}
      {(() => {
        type End = { year: number; v: number; x: number; y: number; ly: number };
        const ends: End[] = [];
        for (const y of shown) {
          if (y === maxYear) continue;
          const e = endOf(y);
          if (!e) continue;
          ends.push({ year: y, v: e.v, x: xOf(e.m), y: yOf(e.v), ly: 0 });
        }
        ends.sort((a, b) => a.y - b.y);
        let prev = -Infinity;
        for (const e of ends) { e.ly = Math.max(e.y, prev + 13); prev = e.ly; }
        return ends.map((e) => (
          <text key={e.year} x={e.x + 7} y={e.ly} fontSize="10" fill={NAVY} fillOpacity="0.6">
            <tspan fontWeight="600">{e.year}</tspan> {compact(e.v)}
          </text>
        ));
      })()}
      {/* current-year end marker + value */}
      {curEnd && (
        <g>
          <circle cx={xOf(curEnd.m)} cy={yOf(curEnd.v)} r="4" fill={VERM} />
          <text x={xOf(curEnd.m) + 7} y={yOf(curEnd.v) + 4} fontSize="11" fontWeight="700" fill={VERM}>
            {maxYear} · {intFmt.format(curEnd.v)}
          </text>
        </g>
      )}
    </svg>
  );
}
