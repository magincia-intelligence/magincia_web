"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FilterOptions, SeriesPoint } from "@/lib/intelligence";

type Measure = "enrolments" | "commencements";
type View = "compare" | "history";

// Brand palette (inline, so the chart rasterises correctly when downloaded)
const NAVY = "#102238";
const VERM = "#EA401C";
const CREAM = "#F5EAD7";

const W = 820;
const H = 400;
const M = { top: 56, right: 104, bottom: 34, left: 60 }; // top holds the title; right holds end labels
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
function fmtDate(d: string): string {
  const [y, m] = d.split("-");
  return `${MONTHS[Number(m)]} ${y}`;
}
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  const initialMonth = initialSeries.length
    ? new Date(initialSeries[initialSeries.length - 1].date).getUTCMonth() + 1 : 12;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [series, setSeries] = useState<SeriesPoint[]>(initialSeries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
  const yOf = useCallback((v: number, yMax: number) => M.top + innerH - (v / yMax) * innerH, []);

  const byYear = useMemo(() => {
    const m = new Map<number, number[]>();
    for (const p of series) {
      const d = new Date(p.date);
      const yr = d.getUTCFullYear();
      const mo = d.getUTCMonth() + 1;
      if (!m.has(yr)) m.set(yr, new Array(13).fill(NaN));
      m.get(yr)![mo] = p[measure];
    }
    return m;
  }, [series, measure]);
  const years = useMemo(() => [...byYear.keys()].sort((a, b) => a - b), [byYear]);
  const maxYear = years.length ? years[years.length - 1] : 0;

  // ----- title + subtitle (also used for the downloaded image + filename) --
  const measureLabel = measure === "enrolments" ? "Enrolments" : "Commencements";
  const title = view === "compare"
    ? `Australian international student ${measure} (YTD) — year comparison`
    : `Australian international student ${measure} (YTD at ${MONTHS[selectedMonth]}) — by year`;
  const subtitle = [
    sector !== "All" ? sector : "All sectors",
    nationality !== "All" ? nationality : "all source countries",
    state !== "All" ? state : "all states",
    providerType !== "All" ? providerType : "all providers",
  ].join(" · ");

  // ===== COMPARE ==========================================================
  const compare = useMemo(() => {
    if (view !== "compare" || !years.length) return null;
    const shown = years.filter((y) => y >= maxYear - PRIOR_YEARS);
    let yMax = 1;
    for (const y of shown) for (let m = 1; m <= 12; m++) {
      const v = byYear.get(y)![m];
      if (!Number.isNaN(v)) yMax = Math.max(yMax, v);
    }
    const xOf = (month: number) => M.left + ((month - 1) / 11) * innerW;
    const lineFor = (y: number) => {
      const arr = byYear.get(y)!;
      let d = "", started = false;
      for (let m = 1; m <= 12; m++) {
        const v = arr[m];
        if (Number.isNaN(v)) continue;
        d += `${started ? "L" : "M"}${xOf(m).toFixed(1)},${yOf(v, yMax).toFixed(1)}`;
        started = true;
      }
      return d;
    };
    return { shown, yMax, xOf, lineFor };
  }, [view, years, maxYear, byYear, yOf]);

  // ===== HISTORY: one BAR per year = YTD total at the selected month =======
  const trend = useMemo(() => {
    if (view !== "history" || !years.length) return null;
    const pts = years
      .map((y) => ({ year: y, v: byYear.get(y)![selectedMonth] }))
      .filter((p) => !Number.isNaN(p.v));
    if (!pts.length) return null;
    const yMax = Math.max(1, ...pts.map((p) => p.v));
    const n = pts.length;
    const band = innerW / n;
    const barW = Math.min(band * 0.68, 30);
    const cx = (i: number) => M.left + (i + 0.5) * band;
    const step = Math.max(1, Math.ceil(n / 11));
    const ticks = pts
      .map((p, i) => ({ x: cx(i), label: `${p.year}`, i }))
      .filter((t) => t.i % step === 0 || t.i === n - 1);
    return { pts, yMax, n, band, barW, cx, ticks };
  }, [view, years, byYear, selectedMonth, yOf]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    if (view === "compare") {
      setHover(Math.min(12, Math.max(1, Math.round((vbX - M.left) / (innerW / 11)) + 1)));
    } else if (trend) {
      const i = Math.floor((vbX - M.left) / trend.band);
      setHover(Math.min(trend.pts.length - 1, Math.max(0, i)));
    }
  };

  const yTicksFor = (yMax: number) =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: yMax * f, y: yOf(yMax * f, yMax) }));

  // ----- download current chart as PNG ------------------------------------
  const download = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // strip the transient hover overlay from the export
    clone.querySelectorAll("[data-hover]").forEach((n) => n.remove());
    const scale = 2;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(W * scale));
    clone.setAttribute("height", String(H * scale));
    clone.setAttribute("style", "font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif");
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${slug(`${measure}-${view}${view === "history" ? "-" + MONTHS[selectedMonth] : ""}-${subtitle}`)}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
          }
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [measure, view, selectedMonth, subtitle]);

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
        <button
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-md border border-navy/15 px-3 py-1.5 text-sm font-semibold text-navy/70 transition hover:border-vermillion hover:text-vermillion"
        >
          <span aria-hidden>↓</span> Download chart
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select label="Sector" value={sector} options={options.sectors} onChange={setSector} />
        <Select label="Source country" value={nationality} options={options.nationalities} onChange={setNationality} />
        <Select label="State" value={state} options={options.states} onChange={setState} />
        <Select label="Provider type" value={providerType} options={options.providerTypes} onChange={setProviderType} />
      </div>

      {/* Month control — Full history view only */}
      {view === "history" && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">YTD at month</span>
          <input
            type="range" min={1} max={12} step={1} value={selectedMonth}
            onChange={(e) => { setHover(null); setSelectedMonth(Number(e.target.value)); }}
            className="h-1 flex-1 cursor-pointer accent-vermillion"
            aria-label="Select month for year-on-year comparison"
          />
          <span className="w-10 text-sm font-semibold text-navy">{MONTHS[selectedMonth]}</span>
        </div>
      )}

      {/* Chart */}
      <div className="relative mt-5">
        {loading && (
          <div className="absolute right-2 top-2 z-10 rounded bg-navy/80 px-2 py-1 text-xs text-cream">Loading…</div>
        )}
        {error && <div className="absolute inset-x-0 top-20 text-center text-sm text-vermillion">{error}</div>}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={title}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* background (so the downloaded PNG isn't transparent) */}
          <rect x="0" y="0" width={W} height={H} fill="#ffffff" />

          {/* title block */}
          <text x="14" y="24" fontSize="15" fontWeight="700" fill={NAVY}>{title}</text>
          <text x="14" y="42" fontSize="11.5" fill={NAVY} fillOpacity="0.6">{subtitle}</text>
          <text x={W - 14} y="24" textAnchor="end" fontSize="12" fontWeight="600" fill={VERM}>magincia.ai</text>

          {/* ---------- COMPARE ---------- */}
          {view === "compare" && compare && (
            <>
              {yTicksFor(compare.yMax).map((t, i) => (
                <g key={i}>
                  <line x1={M.left} x2={W - M.right} y1={t.y} y2={t.y} stroke={NAVY} strokeOpacity="0.08" />
                  <text x={M.left - 8} y={t.y + 4} textAnchor="end" fill={NAVY} fillOpacity="0.5" fontSize="11">{compact(t.v)}</text>
                </g>
              ))}
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <text key={m} x={compare.xOf(m)} y={H - 12} textAnchor="middle" fill={NAVY} fillOpacity="0.5" fontSize="11">{MONTHS[m]}</text>
              ))}
              {compare.shown.filter((y) => y !== maxYear).map((y) => {
                const age = maxYear - y;
                return (
                  <path key={y} d={compare.lineFor(y)} fill="none" stroke={NAVY}
                    strokeWidth="1.5" strokeOpacity={Math.max(0.12, 0.4 - age * 0.05)} strokeLinejoin="round" />
                );
              })}
              <path d={compare.lineFor(maxYear)} fill="none" stroke={VERM} strokeWidth="2.5" strokeLinejoin="round" />
              {(() => {
                const arr = byYear.get(maxYear)!;
                let lm = -1;
                for (let m = 12; m >= 1; m--) { if (!Number.isNaN(arr[m])) { lm = m; break; } }
                if (lm < 0) return null;
                const v = arr[lm], x = compare.xOf(lm), y = yOf(v, compare.yMax);
                const near = x > W - 110;
                return (
                  <g>
                    <circle cx={x} cy={y} r="4" fill={VERM} />
                    <text x={near ? x - 8 : x + 8} y={y - 8} textAnchor={near ? "end" : "start"}
                      fontSize="13" fontWeight="700" fill={VERM}>{intFmt.format(v)}</text>
                  </g>
                );
              })()}
              {(() => {
                type End = { year: number; v: number; x: number; y: number; ly: number };
                const ends: End[] = [];
                for (const y of compare.shown) {
                  if (y === maxYear) continue;
                  const arr = byYear.get(y)!;
                  let lm = -1;
                  for (let m = 12; m >= 1; m--) { if (!Number.isNaN(arr[m])) { lm = m; break; } }
                  if (lm < 0) continue;
                  const v = arr[lm];
                  ends.push({ year: y, v, x: compare.xOf(lm), y: yOf(v, compare.yMax), ly: 0 });
                }
                ends.sort((a, b) => a.y - b.y);
                let prevLy = -Infinity;
                for (const e of ends) { e.ly = Math.max(e.y, prevLy + 13); prevLy = e.ly; }
                return ends.map((e) => (
                  <g key={e.year}>
                    <circle cx={e.x} cy={e.y} r="2.5" fill={NAVY} fillOpacity="0.45" />
                    {Math.abs(e.ly - e.y) > 2 && <line x1={e.x} y1={e.y} x2={e.x + 5} y2={e.ly - 3} stroke={NAVY} strokeOpacity="0.19" />}
                    <text x={e.x + 7} y={e.ly} fontSize="11" fill={NAVY} fillOpacity="0.55">
                      <tspan fontWeight="600">{e.year}</tspan> {intFmt.format(e.v)}
                    </text>
                  </g>
                ));
              })()}
              {hover != null && hover >= 1 && hover <= 12 && (() => {
                const month = hover, x = compare.xOf(month);
                const rows = compare.shown.slice().reverse()
                  .map((y) => ({ y, v: byYear.get(y)![month] }))
                  .filter((r) => !Number.isNaN(r.v));
                if (!rows.length) return null;
                const h = 18 + rows.length * 15;
                return (
                  <g data-hover>
                    <line x1={x} x2={x} y1={M.top} y2={M.top + innerH} stroke={NAVY} strokeOpacity="0.25" strokeDasharray="3 3" />
                    {rows.map((r) => (
                      <circle key={r.y} cx={x} cy={yOf(r.v, compare.yMax)} r={r.y === maxYear ? 4 : 2.5}
                        fill={r.y === maxYear ? VERM : NAVY} fillOpacity={r.y === maxYear ? 1 : 0.4} />
                    ))}
                    <g transform={`translate(${Math.min(x + 8, W - 132)}, ${M.top + 4})`}>
                      <rect width="124" height={h} rx="4" fill={NAVY} />
                      <text x="8" y="15" fill={CREAM} fillOpacity="0.7" fontSize="10">{MONTHS[month]} (YTD)</text>
                      {rows.map((r, i) => (
                        <text key={r.y} x="8" y={30 + i * 15} fontSize="11"
                          fill={r.y === maxYear ? VERM : CREAM} fillOpacity={r.y === maxYear ? 1 : 0.8}
                          fontWeight={r.y === maxYear ? 700 : 400}>
                          {r.y}: {intFmt.format(r.v)}
                        </text>
                      ))}
                    </g>
                  </g>
                );
              })()}
            </>
          )}

          {/* ---------- HISTORY ---------- */}
          {view === "history" && trend && (
            <>
              {yTicksFor(trend.yMax).map((t, i) => (
                <g key={i}>
                  <line x1={M.left} x2={W - M.right} y1={t.y} y2={t.y} stroke={NAVY} strokeOpacity="0.08" />
                  <text x={M.left - 8} y={t.y + 4} textAnchor="end" fill={NAVY} fillOpacity="0.5" fontSize="11">{compact(t.v)}</text>
                </g>
              ))}
              {trend.ticks.map((t, i) => (
                <text key={i} x={t.x} y={H - 12} textAnchor="middle" fill={NAVY} fillOpacity="0.5" fontSize="11">{t.label}</text>
              ))}
              {/* bars: current year red, prior years grey */}
              {trend.pts.map((p, i) => {
                const x = trend.cx(i);
                const y = yOf(p.v, trend.yMax);
                const base = M.top + innerH;
                const isCur = p.year === maxYear;
                return (
                  <rect key={p.year} x={x - trend.barW / 2} y={y} width={trend.barW} height={Math.max(0, base - y)}
                    fill={isCur ? VERM : NAVY} fillOpacity={isCur ? 1 : 0.28} rx="1.5" />
                );
              })}
              {/* value label on the current-year bar */}
              {(() => {
                const i = trend.pts.findIndex((p) => p.year === maxYear);
                if (i < 0) return null;
                const p = trend.pts[i], x = trend.cx(i), y = yOf(p.v, trend.yMax);
                return (
                  <text x={x} y={Math.max(M.top + 9, y - 6)} textAnchor="middle" fontSize="12" fontWeight="700" fill={VERM}>
                    {intFmt.format(p.v)}
                  </text>
                );
              })()}
              {hover != null && trend.pts[hover] && (() => {
                const p = trend.pts[hover], x = trend.cx(hover), y = yOf(p.v, trend.yMax);
                const tx = Math.min(Math.max(x - 71, M.left), W - M.right - 142);
                return (
                  <g data-hover>
                    <rect x={x - trend.barW / 2 - 1.5} y={y - 1.5} width={trend.barW + 3} height={Math.max(0, M.top + innerH - y) + 1.5}
                      fill="none" stroke={NAVY} strokeOpacity="0.55" />
                    <g transform={`translate(${tx}, ${Math.max(M.top, y - 44)})`}>
                      <rect width="142" height="40" rx="4" fill={NAVY} />
                      <text x="8" y="16" fill={CREAM} fontSize="11">{MONTHS[selectedMonth]} {p.year} (YTD)</text>
                      <text x="8" y="32" fill={CREAM} fontSize="13" fontWeight="600">{intFmt.format(p.v)}</text>
                    </g>
                  </g>
                );
              })()}
            </>
          )}

          {/* source credit (bottom-right, free corner) */}
          <text x={W - 12} y={H - 6} textAnchor="end" fontSize="9" fill={NAVY} fillOpacity="0.4">
            Source: Australian Department of Education
          </text>
        </svg>

        {view === "compare" && compare && (
          <div className="mt-1 flex items-center justify-center gap-5 text-xs text-navy/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 bg-vermillion" /> {maxYear} (current)
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
          : ` Each bar is the YTD total at ${MONTHS[selectedMonth]} for that year — drag the slider to compare a different month across years.`}{" "}
        Source: Australian Department of Education.
      </p>
    </div>
  );
}
