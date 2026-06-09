"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FilterOptions, SeriesPoint } from "@/lib/intelligence";

type Measure = "enrolments" | "commencements";

const W = 820;
const H = 360;
const M = { top: 16, right: 18, bottom: 30, left: 60 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;

const intFmt = new Intl.NumberFormat("en-AU");
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}
function fmtDate(d: string): string {
  const [y, m] = d.split("-");
  const month = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m)];
  return `${month} ${y}`;
}

function Select({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-navy/50">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-navy/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-navy focus:border-vermillion focus:outline-none"
      >
        <option value="All">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function EnrolmentsExplorer({
  options, initialSeries,
}: { options: FilterOptions; initialSeries: SeriesPoint[] }) {
  const [sector, setSector] = useState("All");
  const [nationality, setNationality] = useState("All");
  const [state, setState] = useState("All");
  const [providerType, setProviderType] = useState("All");
  const [measure, setMeasure] = useState<Measure>("enrolments");
  const [series, setSeries] = useState<SeriesPoint[]>(initialSeries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Refetch when a filter (not the measure) changes. Skip the initial render,
  // which already has the server-provided national series.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const params = new URLSearchParams();
    if (sector !== "All") params.set("sector", sector);
    if (nationality !== "All") params.set("nationality", nationality);
    if (state !== "All") params.set("state", state);
    if (providerType !== "All") params.set("providerType", providerType);
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/intelligence/series?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setSeries(d.series as SeriesPoint[]))
      .catch((e) => { if (e.name !== "AbortError") setError("Couldn’t load data — try again."); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [sector, nationality, state, providerType]);

  const values = useMemo(() => series.map((p) => p[measure]), [series, measure]);
  const yMax = useMemo(() => Math.max(1, ...values), [values]);

  const t0 = series.length ? new Date(series[0].date).getTime() : 0;
  const t1 = series.length ? new Date(series[series.length - 1].date).getTime() : 1;
  const xOf = useCallback((d: string) => {
    const span = t1 - t0 || 1;
    return M.left + ((new Date(d).getTime() - t0) / span) * innerW;
  }, [t0, t1]);
  const yOf = useCallback((v: number) => M.top + innerH - (v / yMax) * innerH, [yMax]);

  const path = useMemo(() => {
    if (!series.length) return "";
    return series
      .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.date).toFixed(1)},${yOf(p[measure]).toFixed(1)}`)
      .join(" ");
  }, [series, measure, xOf, yOf]);

  // Year gridlines / labels (thinned to ~8 across the span).
  const yearTicks = useMemo(() => {
    if (!series.length) return [] as { x: number; year: number }[];
    const y0 = new Date(series[0].date).getFullYear();
    const y1 = new Date(series[series.length - 1].date).getFullYear();
    const step = Math.max(1, Math.ceil((y1 - y0) / 8));
    const ticks: { x: number; year: number }[] = [];
    for (let y = y0; y <= y1; y += step) ticks.push({ x: xOf(`${y}-01-01`), year: y });
    return ticks;
  }, [series, xOf]);

  const yTicks = useMemo(
    () => [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: yMax * f, y: yOf(yMax * f) })),
    [yMax, yOf],
  );

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!series.length || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < series.length; i++) {
      const dist = Math.abs(xOf(series[i].date) - vbX);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    setHover(best);
  };

  const hoverPoint = hover != null ? series[hover] : null;
  const latest = series.length ? series[series.length - 1] : null;

  return (
    <div className="mt-8 rounded-xl border border-navy/10 bg-white/70 p-4 sm:p-6">
      {/* Measure toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-navy/15 p-0.5">
          {(["enrolments", "commencements"] as Measure[]).map((m) => (
            <button
              key={m}
              onClick={() => setMeasure(m)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${
                measure === m ? "bg-navy text-cream" : "text-navy/60 hover:text-navy"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {latest && (
          <div className="text-sm text-navy/60">
            Latest ({fmtDate(latest.date)}):{" "}
            <span className="font-semibold text-navy">{intFmt.format(latest[measure])}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select label="Sector" value={sector} options={options.sectors} onChange={setSector} />
        <Select label="Source country" value={nationality} options={options.nationalities} onChange={setNationality} />
        <Select label="State" value={state} options={options.states} onChange={setState} />
        <Select label="Provider type" value={providerType} options={options.providerTypes} onChange={setProviderType} />
      </div>

      {/* Chart */}
      <div className="relative mt-5">
        {loading && (
          <div className="absolute right-2 top-2 z-10 rounded bg-navy/80 px-2 py-1 text-xs text-cream">
            Loading…
          </div>
        )}
        {error && <div className="absolute inset-x-0 top-8 text-center text-sm text-vermillion">{error}</div>}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`International student YTD ${measure} over time`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* y gridlines + labels */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={M.left} x2={W - M.right} y1={t.y} y2={t.y} stroke="#10223815" />
              <text x={M.left - 8} y={t.y + 4} textAnchor="end" className="fill-navy/50" fontSize="11">
                {compact(t.v)}
              </text>
            </g>
          ))}
          {/* x year labels */}
          {yearTicks.map((t, i) => (
            <text key={i} x={t.x} y={H - 10} textAnchor="middle" className="fill-navy/50" fontSize="11">
              {t.year}
            </text>
          ))}
          {/* line */}
          <path d={path} fill="none" stroke="#EA401C" strokeWidth="2" strokeLinejoin="round" />
          {/* hover guide + dot + tooltip */}
          {hoverPoint && (
            <g>
              <line
                x1={xOf(hoverPoint.date)} x2={xOf(hoverPoint.date)}
                y1={M.top} y2={M.top + innerH} stroke="#10223840" strokeDasharray="3 3"
              />
              <circle cx={xOf(hoverPoint.date)} cy={yOf(hoverPoint[measure])} r="4" fill="#EA401C" />
              <g transform={`translate(${Math.min(xOf(hoverPoint.date) + 8, W - 150)}, ${M.top + 6})`}>
                <rect width="142" height="40" rx="4" fill="#102238" />
                <text x="8" y="16" className="fill-cream" fontSize="11">{fmtDate(hoverPoint.date)}</text>
                <text x="8" y="32" className="fill-cream" fontSize="13" fontWeight="600">
                  {intFmt.format(hoverPoint[measure])} {measure}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <p className="mt-3 text-xs text-navy/50">
        Figures are <strong className="font-semibold text-navy/70">year-to-date</strong> as of each month,
        so the line resets each January. Source: Australian Department of Education. {series.length} months,
        {" "}{fmtDate(series[0]?.date ?? "")}–{fmtDate(latest?.date ?? "")}.
      </p>
    </div>
  );
}
