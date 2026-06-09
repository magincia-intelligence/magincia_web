"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FilterOptions, SeriesPoint } from "@/lib/intelligence";

type Measure = "enrolments" | "commencements";
type View = "compare" | "history";

const W = 820;
const H = 360;
const M = { top: 16, right: 18, bottom: 30, left: 60 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;

const PRIOR_YEARS = 5; // grey comparison series behind the current year
const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const intFmt = new Intl.NumberFormat("en-AU");
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}
function fmtDate(d: string): string {
  const [y, m] = d.split("-");
  return `${MONTHS[Number(m)]} ${y}`;
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

function Toggle<T extends string>({
  value, options, onChange,
}: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-navy/15 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            value === o.key ? "bg-navy text-cream" : "text-navy/60 hover:text-navy"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
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
  const [view, setView] = useState<View>("compare");
  const [series, setSeries] = useState<SeriesPoint[]>(initialSeries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Refetch when a filter (not the measure/view) changes. Skip the first render.
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

  const latest = series.length ? series[series.length - 1] : null;

  // ----- shared scales helpers --------------------------------------------
  const yOf = useCallback((v: number, yMax: number) => M.top + innerH - (v / yMax) * innerH, []);

  // ===== HISTORY view (continuous 2005→latest) ============================
  const history = useMemo(() => {
    if (view !== "history" || !series.length) return null;
    const values = series.map((p) => p[measure]);
    const yMax = Math.max(1, ...values);
    const t0 = new Date(series[0].date).getTime();
    const t1 = new Date(series[series.length - 1].date).getTime();
    const xOf = (d: string) => M.left + ((new Date(d).getTime() - t0) / (t1 - t0 || 1)) * innerW;
    const path = series
      .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.date).toFixed(1)},${yOf(p[measure], yMax).toFixed(1)}`)
      .join(" ");
    const y0 = new Date(series[0].date).getFullYear();
    const y1 = new Date(series[series.length - 1].date).getFullYear();
    const step = Math.max(1, Math.ceil((y1 - y0) / 8));
    const ticks: { x: number; label: string }[] = [];
    for (let y = y0; y <= y1; y += step) ticks.push({ x: xOf(`${y}-01-01`), label: `${y}` });
    return { yMax, xOf, path, xTicks: ticks, points: series };
  }, [view, series, measure, yOf]);

  // ===== COMPARE view (months on x, one line per year) ====================
  const compare = useMemo(() => {
    if (view !== "compare" || !series.length) return null;
    const byYear = new Map<number, number[]>(); // year -> value by month index (1..12)
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
    const xOf = (month: number) => M.left + ((month - 1) / 11) * innerW;
    const lineFor = (y: number) => {
      const arr = byYear.get(y)!;
      let d = "";
      let started = false;
      for (let m = 1; m <= 12; m++) {
        const v = arr[m];
        if (Number.isNaN(v)) continue;
        d += `${started ? "L" : "M"}${xOf(m).toFixed(1)},${yOf(v, yMax).toFixed(1)}`;
        started = true;
      }
      return d;
    };
    return { byYear, shown, maxYear, yMax, xOf, lineFor };
  }, [view, series, measure, yOf]);

  // ----- hover ------------------------------------------------------------
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    if (view === "history" && history) {
      let best = 0, bestDist = Infinity;
      history.points.forEach((p, i) => {
        const dist = Math.abs(history.xOf(p.date) - vbX);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setHover(best);
    } else if (view === "compare") {
      const m = Math.min(12, Math.max(1, Math.round((vbX - M.left) / (innerW / 11)) + 1));
      setHover(m);
    }
  };

  const yTicksFor = (yMax: number) =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: yMax * f, y: yOf(yMax * f, yMax) }));

  return (
    <div className="mt-8 rounded-xl border border-navy/10 bg-white/70 p-4 sm:p-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            value={view}
            onChange={(v) => { setHover(null); setView(v); }}
            options={[{ key: "compare", label: "Year comparison" }, { key: "history", label: "Full history" }]}
          />
          <Toggle
            value={measure}
            onChange={setMeasure}
            options={[{ key: "enrolments", label: "Enrolments" }, { key: "commencements", label: "Commencements" }]}
          />
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
          <div className="absolute right-2 top-2 z-10 rounded bg-navy/80 px-2 py-1 text-xs text-cream">Loading…</div>
        )}
        {error && <div className="absolute inset-x-0 top-8 text-center text-sm text-vermillion">{error}</div>}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`International student YTD ${measure} — ${view === "compare" ? "current year vs previous five years" : "2005 to latest"}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* ---------- HISTORY ---------- */}
          {view === "history" && history && (
            <>
              {yTicksFor(history.yMax).map((t, i) => (
                <g key={i}>
                  <line x1={M.left} x2={W - M.right} y1={t.y} y2={t.y} stroke="#10223815" />
                  <text x={M.left - 8} y={t.y + 4} textAnchor="end" className="fill-navy/50" fontSize="11">{compact(t.v)}</text>
                </g>
              ))}
              {history.xTicks.map((t, i) => (
                <text key={i} x={t.x} y={H - 10} textAnchor="middle" className="fill-navy/50" fontSize="11">{t.label}</text>
              ))}
              <path d={history.path} fill="none" stroke="#EA401C" strokeWidth="2" strokeLinejoin="round" />
              {hover != null && history.points[hover] && (() => {
                const p = history.points[hover];
                const x = history.xOf(p.date);
                return (
                  <g>
                    <line x1={x} x2={x} y1={M.top} y2={M.top + innerH} stroke="#10223840" strokeDasharray="3 3" />
                    <circle cx={x} cy={yOf(p[measure], history.yMax)} r="4" fill="#EA401C" />
                    <g transform={`translate(${Math.min(x + 8, W - 150)}, ${M.top + 6})`}>
                      <rect width="142" height="40" rx="4" fill="#102238" />
                      <text x="8" y="16" className="fill-cream" fontSize="11">{fmtDate(p.date)}</text>
                      <text x="8" y="32" className="fill-cream" fontSize="13" fontWeight="600">{intFmt.format(p[measure])}</text>
                    </g>
                  </g>
                );
              })()}
            </>
          )}

          {/* ---------- COMPARE ---------- */}
          {view === "compare" && compare && (
            <>
              {yTicksFor(compare.yMax).map((t, i) => (
                <g key={i}>
                  <line x1={M.left} x2={W - M.right} y1={t.y} y2={t.y} stroke="#10223815" />
                  <text x={M.left - 8} y={t.y + 4} textAnchor="end" className="fill-navy/50" fontSize="11">{compact(t.v)}</text>
                </g>
              ))}
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <text key={m} x={compare.xOf(m)} y={H - 10} textAnchor="middle" className="fill-navy/50" fontSize="11">{MONTHS[m]}</text>
              ))}
              {/* prior years (grey, oldest faintest) */}
              {compare.shown.filter((y) => y !== compare.maxYear).map((y) => {
                const age = compare.maxYear - y; // 1..5
                return (
                  <path key={y} d={compare.lineFor(y)} fill="none" stroke="#102238"
                    strokeWidth="1.5" strokeOpacity={Math.max(0.12, 0.4 - age * 0.05)} strokeLinejoin="round" />
                );
              })}
              {/* current year (highlighted, drawn on top) */}
              <path d={compare.lineFor(compare.maxYear)} fill="none" stroke="#EA401C" strokeWidth="2.5" strokeLinejoin="round" />
              {/* hover guide + per-year readout */}
              {hover != null && (() => {
                const month = hover;
                const x = compare.xOf(month);
                const rows = compare.shown
                  .slice().reverse()
                  .map((y) => ({ y, v: compare.byYear.get(y)![month] }))
                  .filter((r) => !Number.isNaN(r.v));
                if (!rows.length) return null;
                const h = 18 + rows.length * 15;
                return (
                  <g>
                    <line x1={x} x2={x} y1={M.top} y2={M.top + innerH} stroke="#10223840" strokeDasharray="3 3" />
                    {rows.map((r) => (
                      <circle key={r.y} cx={x} cy={yOf(r.v, compare.yMax)} r={r.y === compare.maxYear ? 4 : 2.5}
                        fill={r.y === compare.maxYear ? "#EA401C" : "#102238"} fillOpacity={r.y === compare.maxYear ? 1 : 0.4} />
                    ))}
                    <g transform={`translate(${Math.min(x + 8, W - 132)}, ${M.top + 4})`}>
                      <rect width="124" height={h} rx="4" fill="#102238" />
                      <text x="8" y="15" className="fill-cream/70" fontSize="10">{MONTHS[month]} (YTD)</text>
                      {rows.map((r, i) => (
                        <text key={r.y} x="8" y={30 + i * 15} fontSize="11"
                          className={r.y === compare.maxYear ? "fill-vermillion" : "fill-cream/80"}
                          fontWeight={r.y === compare.maxYear ? 700 : 400}>
                          {r.y}: {intFmt.format(r.v)}
                        </text>
                      ))}
                    </g>
                  </g>
                );
              })()}
            </>
          )}
        </svg>

        {/* Legend (compare view) */}
        {view === "compare" && compare && (
          <div className="mt-1 flex items-center justify-center gap-5 text-xs text-navy/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 bg-vermillion" /> {compare.maxYear} (current)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 bg-navy/30" /> previous {PRIOR_YEARS} years
            </span>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-navy/50">
        Figures are <strong className="font-semibold text-navy/70">year-to-date</strong> as of each month.
        {view === "compare"
          ? " Each line is one year's YTD path (Jan→Dec), so the current year can be read against the same months in prior years."
          : " The continuous line resets each January."}{" "}
        Source: Australian Department of Education.
      </p>
    </div>
  );
}
