"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Breakdown, Filters } from "@/lib/intelligence";

const NAVY = "#102238";
const VERM = "#EA401C";
const BLUE = "#1E487A";
const W = 820, H = 380;
const M = { top: 24, right: 20, bottom: 44, left: 66 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;
const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const intFmt = new Intl.NumberFormat("en-AU");
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

type Dim = "nationality" | "region";
type Pt = { label: string; current: number; pct: number; x: number; y: number; r: number };

export default function MarketMatrix({
  measure, filters,
}: {
  measure: "enrolments" | "commencements";
  filters: Filters;
}) {
  const [dim, setDim] = useState<Dim>("nationality");
  const [data, setData] = useState<Breakdown | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const params = new URLSearchParams({ dimension: dim, measure });
    if (filters.sector && filters.sector !== "All") params.set("sector", filters.sector);
    if (filters.region && filters.region !== "All") params.set("region", filters.region);
    if (filters.nationality && filters.nationality !== "All") params.set("nationality", filters.nationality);
    if (filters.state && filters.state !== "All") params.set("state", filters.state);
    if (filters.providerType && filters.providerType !== "All") params.set("providerType", filters.providerType);
    const ctrl = new AbortController();
    fetch(`/api/intelligence/breakdown?${params}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d) => setData(d as Breakdown))
      .catch((e) => { if (e.name !== "AbortError") setData(null); });
    return () => ctrl.abort();
  }, [dim, measure, filters]);

  const { pts, yLim, period, avgX, avgVol } = useMemo(() => {
    const empty = { pts: [] as Pt[], yLim: 50, period: "", avgX: 0, avgVol: 0 };
    if (!data) return empty;
    const minVolume = dim === "region" ? 0 : 200;
    const maxPoints = dim === "region" ? 12 : 45;
    const base = data.rows
      .filter((r) => r.previous > 0 && r.current >= minVolume)
      .map((r) => ({ label: r.label, current: r.current, pct: ((r.current - r.previous) / r.previous) * 100 }))
      .sort((a, b) => b.current - a.current)
      .slice(0, maxPoints);
    if (!base.length) return empty;
    const maxV = Math.max(...base.map((b) => b.current));
    const avgVol = base.reduce((s, b) => s + b.current, 0) / base.length;
    const maxAbs = Math.max(20, ...base.map((b) => Math.abs(b.pct)));
    const yLim = Math.min(150, Math.ceil(maxAbs / 10) * 10);
    const xOf = (v: number) => M.left + (Math.sqrt(v) / Math.sqrt(maxV)) * innerW;
    const yOf = (p: number) => M.top + innerH / 2 - (Math.max(-yLim, Math.min(yLim, p)) / yLim) * (innerH / 2);
    const rOf = (v: number) => 4 + (Math.sqrt(v) / Math.sqrt(maxV)) * 18;
    const pts = base.map((b) => ({ ...b, x: xOf(b.current), y: yOf(b.pct), r: rOf(b.current) }));
    const period = `${MONTHS[data.monthNum]} ${data.currentYear} vs ${data.previousYear}`;
    return { pts, yLim, period, avgX: xOf(avgVol), avgVol };
  }, [data, dim]);

  const zeroY = M.top + innerH / 2;
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !pts.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const d = (p.x - mx) ** 2 + (p.y - my) ** 2; if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };

  // label the largest few countries; label every region
  const labelled = useMemo(
    () => new Set(pts.slice(0, dim === "region" ? pts.length : 8).map((p) => p.label)),
    [pts, dim],
  );

  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">Source Market SWOT — Growth vs Volume</h3>
        <div className="inline-flex rounded-md border border-navy/15 p-0.5 text-xs">
          {(["nationality", "region"] as Dim[]).map((d) => (
            <button key={d} onClick={() => { setDim(d); setHover(null); }}
              className={`rounded px-2 py-0.5 font-semibold transition ${
                dim === d ? "bg-navy text-cream" : "text-navy/55 hover:text-navy"}`}>
              {d === "nationality" ? "Country" : "Region"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-0.5 text-xs text-navy/45">
        {period ? `${period} · ` : ""}Split by 0% growth and average volume. Strengths = large &amp; growing ·
        Opportunities = small &amp; growing · Weaknesses = large &amp; declining · Threats = small &amp; declining.
      </p>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="mx-auto mt-2 block w-full max-h-[440px]"
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {/* zero-growth axis */}
        <line x1={M.left} x2={W - M.right} y1={zeroY} y2={zeroY} stroke={NAVY} strokeOpacity="0.25" />
        <text x={W - M.right} y={zeroY - 5} textAnchor="end" fontSize="10" fill={NAVY} fillOpacity="0.55">0% year-on-year</text>
        {/* y-axis bounds + title */}
        <text x={M.left - 6} y={M.top + 10} textAnchor="end" fontSize="10" fill={NAVY} fillOpacity="0.45">+{yLim}%</text>
        <text x={M.left - 6} y={M.top + innerH - 2} textAnchor="end" fontSize="10" fill={NAVY} fillOpacity="0.45">−{yLim}%</text>
        <text transform={`translate(15, ${M.top + innerH / 2}) rotate(-90)`} textAnchor="middle"
          fontSize="11" fontWeight="600" fill={NAVY} fillOpacity="0.55">Year-on-Year Growth</text>
        {/* average-volume axis */}
        {avgX > 0 && (
          <>
            <line x1={avgX} x2={avgX} y1={M.top} y2={M.top + innerH} stroke={NAVY} strokeOpacity="0.25" strokeDasharray="4 3" />
            <text x={avgX + 4} y={M.top + 10} fontSize="10" fill={NAVY} fillOpacity="0.55">Avg volume ({compact(avgVol)})</text>
          </>
        )}
        {/* SWOT quadrant labels */}
        {pts.length > 0 && (
          <>
            <text x={W - M.right - 6} y={M.top + 14} textAnchor="end" fontSize="11" fontWeight="700" fill={BLUE} fillOpacity="0.85">STRENGTHS</text>
            <text x={M.left + 6} y={M.top + 14} textAnchor="start" fontSize="11" fontWeight="700" fill={BLUE} fillOpacity="0.85">OPPORTUNITIES</text>
            <text x={W - M.right - 6} y={M.top + innerH - 6} textAnchor="end" fontSize="11" fontWeight="700" fill={VERM} fillOpacity="0.9">WEAKNESSES</text>
            <text x={M.left + 6} y={M.top + innerH - 6} textAnchor="start" fontSize="11" fontWeight="700" fill={VERM} fillOpacity="0.9">THREATS</text>
          </>
        )}
        {/* x axis label */}
        <text x={M.left + innerW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill={NAVY} fillOpacity="0.5">
          {measure === "enrolments" ? "Enrolments" : "Commencements"} (Year to Date, square-root scale) →
        </text>
        {/* points */}
        {pts.map((p, i) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={p.r}
            fill={p.pct >= 0 ? BLUE : VERM} fillOpacity={hover === i ? 0.8 : 0.55}
            stroke={p.pct >= 0 ? BLUE : VERM} strokeWidth="1.5" strokeOpacity="1" />
        ))}
        {/* labels */}
        {pts.map((p) => labelled.has(p.label) && (
          <text key={`l-${p.label}`} x={p.x} y={p.y - p.r - 3} textAnchor="middle" fontSize="10" fontWeight="600" fill={NAVY} fillOpacity="0.75">
            {p.label}
          </text>
        ))}
        {/* hover tooltip */}
        {hover != null && pts[hover] && (() => {
          const p = pts[hover];
          const tx = Math.min(Math.max(p.x - 70, M.left), W - M.right - 150);
          const ty = Math.max(M.top, p.y - 52);
          return (
            <g>
              <circle cx={p.x} cy={p.y} r={p.r + 2} fill="none" stroke={NAVY} strokeOpacity="0.6" />
              <g transform={`translate(${tx}, ${ty})`}>
                <rect width="150" height="44" rx="4" fill={NAVY} />
                <text x="8" y="17" fill="#F5EAD7" fontSize="12" fontWeight="600">{p.label}</text>
                <text x="8" y="33" fill="#F5EAD7" fontSize="11" fillOpacity="0.85">
                  {intFmt.format(p.current)} · {p.pct >= 0 ? "+" : ""}{p.pct.toFixed(0)}% YoY
                </text>
              </g>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
