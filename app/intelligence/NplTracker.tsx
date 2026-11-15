"use client";

import { useMemo, useState } from "react";
import type { NplPoint } from "@/lib/npl";

const NAVY = "#102238";
const VERM = "#EA401C";
const BLUE = "#1E487A";
const intFmt = new Intl.NumberFormat("en-AU");
const kFmt = (v: number) => `${Math.round(v / 1000)}k`;
const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December"];

type Bound = "upper" | "lower";

// Where `target` sits inside the [lower, upper] band, 0 = at lower, 1 = at upper.
const bandPosition = (target: number, lower: number, upper: number) =>
  (target - lower) / (upper - lower);

export default function NplTracker({ series, targets }: {
  series: NplPoint[];
  targets: Record<number, number>;
}) {
  const years = useMemo(
    () => [...new Set(series.map((p) => p.year))].filter((y) => targets[y] !== undefined).sort(),
    [series, targets],
  );
  const [year, setYear] = useState(years[years.length - 1]);
  // Assumed change in the remaining months vs the same months last year (%).
  // null = follow each bound's own year-to-date trend.
  const [adj, setAdj] = useState<number | null>(null);

  const byYear = (y: number) => series.filter((p) => p.year === y).sort((a, b) => a.month - b.month);
  const cur = byYear(year);
  const prev = byYear(year - 1);
  const target = targets[year];
  const lastMonth = cur[cur.length - 1]?.month ?? 0;
  const complete = lastMonth === 12;
  const canProject = !complete && prev.length === 12 && lastMonth > 0;
  const at = (rows: NplPoint[], m: number) => rows.find((p) => p.month === m)!;

  const ytdYoy = (b: Bound) =>
    prev.length >= lastMonth && lastMonth > 0
      ? 100 * (at(cur, lastMonth)[b] / at(prev, lastMonth)[b] - 1)
      : 0;
  const growth = (b: Bound) => (adj ?? ytdYoy(b)) / 100;

  // Projection: carry the year-to-date figure forward by last year's intake in
  // each remaining month, scaled by the assumed change.
  const project = (b: Bound) => {
    if (!canProject) return [] as { m: number; v: number }[];
    const base = at(cur, lastMonth)[b];
    const prevBase = at(prev, lastMonth)[b];
    const out = [{ m: lastMonth, v: base }];
    for (let m = lastMonth + 1; m <= 12; m++) {
      out.push({ m, v: base + (at(prev, m)[b] - prevBase) * (1 + growth(b)) });
    }
    return out;
  };
  const projU = project("upper");
  const projL = project("lower");
  const decU = complete ? at(cur, 12).upper : projU[projU.length - 1]?.v ?? 0;
  const decL = complete ? at(cur, 12).lower : projL[projL.length - 1]?.v ?? 0;

  // Reference: where last year's planning level sat in last year's final band.
  const prevTarget = targets[year - 1];
  const prevPos = prevTarget && prev.length === 12
    ? bandPosition(prevTarget, at(prev, 12).lower, at(prev, 12).upper)
    : null;
  const pos = bandPosition(target, decL, decU);

  // ---- Chart geometry ----------------------------------------------------
  const W = 780, H = 400, M = { top: 24, right: 128, bottom: 40, left: 64 };
  const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
  const yMax = Math.ceil(Math.max(target * 1.12, decU * 1.05,
    prev.length ? at(prev, prev.length).upper * 1.05 : 0) / 50000) * 50000;
  const xOf = (m: number) => M.left + ((m - 1) / 11) * iw;
  const yOf = (v: number) => M.top + ih - (v / yMax) * ih;
  const line = (pts: { m: number; v: number }[]) =>
    pts.map((p, i) => `${i ? "L" : "M"}${xOf(p.m).toFixed(1)},${yOf(p.v).toFixed(1)}`).join(" ");
  const band = (u: { m: number; v: number }[], l: { m: number; v: number }[]) =>
    `${line(u)} ${[...l].reverse().map((p) => `L${xOf(p.m).toFixed(1)},${yOf(p.v).toFixed(1)}`).join(" ")} Z`;
  const actU = cur.map((p) => ({ m: p.month, v: p.upper }));
  const actL = cur.map((p) => ({ m: p.month, v: p.lower }));
  const prevU = prev.map((p) => ({ m: p.month, v: p.upper }));
  const prevL = prev.map((p) => ({ m: p.month, v: p.lower }));
  const ticks = Array.from({ length: yMax / 50000 + 1 }, (_, i) => i * 50000);

  const latest = at(cur, lastMonth);
  const latestPrev = prev.length >= lastMonth ? at(prev, lastMonth) : null;
  const sectorYoy = (k: "he" | "vet") =>
    latestPrev ? 100 * (latest[k] / latestPrev[k] - 1) : null;

  const verdict = decU < target
    ? `Even the upper bound is projected to finish ${intFmt.format(Math.round(target - decU))} short of the planning level.`
    : decL > target
      ? `Even the lower bound is projected to exceed the planning level, by ${intFmt.format(Math.round(decL - target))}.`
      : `The planning level falls within the projected range, ${Math.round(pos * 100)}% of the way from the lower bound to the upper bound.`;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-navy/70">Year</span>
        {years.map((y) => (
          <button key={y} onClick={() => { setYear(y); setAdj(null); }}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${y === year
              ? "bg-navy text-cream" : "border border-navy/20 text-navy/70 hover:border-navy/50"}`}>
            {y}
          </button>
        ))}
        <span className="ml-auto text-sm text-navy/60">
          Data to {MONTHS_LONG[lastMonth - 1]} {year}
          {canProject ? " · projection to December" : complete ? " · full year" : ""}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={intFmt.format(target)} label={`National Planning Level, ${year}`} accent={VERM} />
        <Stat value={`${kFmt(latest.lower)}–${kFmt(latest.upper)}`}
          label={`Commencements to ${MONTHS[lastMonth - 1]} (HE + VET range)`} />
        <Stat value={`${kFmt(decL)}–${kFmt(decU)}`}
          label={complete ? "Full-year range" : "Projected full-year range"} />
        <Stat value={`${Math.round(pos * 100)}%`}
          label={prevPos !== null
            ? `Where the planning level sits in the range (${year - 1}: ${Math.round(prevPos * 100)}%)`
            : "Where the planning level sits in the range"} />
      </div>

      <figure className="mt-6 rounded-2xl border border-navy/10 bg-white/70 p-5 sm:p-6">
        <figcaption className="mb-2">
          <h3 className="text-base font-semibold text-navy">
            Year-to-date commencements vs the {year} National Planning Level
          </h3>
          <p className="mt-0.5 text-sm text-navy/60">
            Shaded band: the measurable range for new overseas student commencements. Dashed: projection.
            Grey: {year - 1} for comparison.
          </p>
        </figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
          aria-label={`Year-to-date Higher Education and VET commencements against the ${year} National Planning Level`}>
          <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={yOf(t)} y2={yOf(t)} stroke={NAVY} strokeOpacity="0.07" />
              <text x={M.left - 8} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill={NAVY} fillOpacity="0.55">
                {intFmt.format(t)}
              </text>
            </g>
          ))}
          {MONTHS.map((m, i) => (
            <text key={m} x={xOf(i + 1)} y={M.top + ih + 20} textAnchor="middle" fontSize="11"
              fill={NAVY} fillOpacity="0.55">{m}</text>
          ))}

          {/* Previous year, for reference */}
          {prev.length === 12 && (
            <g>
              <path d={band(prevU, prevL)} fill={NAVY} fillOpacity="0.04" />
              <path d={line(prevU)} fill="none" stroke={NAVY} strokeOpacity="0.25" strokeWidth="1.5" />
              <path d={line(prevL)} fill="none" stroke={NAVY} strokeOpacity="0.25" strokeWidth="1.5" />
            </g>
          )}

          {/* This year: actual band + lines */}
          <path d={band(actU, actL)} fill={BLUE} fillOpacity="0.16" />
          {canProject && <path d={band(projU, projL)} fill={BLUE} fillOpacity="0.07" />}
          <path d={line(actU)} fill="none" stroke={NAVY} strokeWidth="2.5" />
          <path d={line(actL)} fill="none" stroke={BLUE} strokeWidth="2.5" />
          {canProject && (
            <g>
              <path d={line(projU)} fill="none" stroke={NAVY} strokeWidth="2" strokeDasharray="5 4" />
              <path d={line(projL)} fill="none" stroke={BLUE} strokeWidth="2" strokeDasharray="5 4" />
            </g>
          )}

          {/* Planning level */}
          <line x1={M.left} x2={W - M.right} y1={yOf(target)} y2={yOf(target)}
            stroke={VERM} strokeWidth="2" />
          <text x={M.left + 6} y={yOf(target) - 7} fontSize="11" fontWeight="700" fill={VERM}>
            NPL {year}: {intFmt.format(target)}
          </text>

          {/* End labels */}
          <text x={xOf(12) + 8} y={yOf(decU) + 4} fontSize="11" fontWeight="700" fill={NAVY}>
            {intFmt.format(Math.round(decU))}
          </text>
          <text x={xOf(12) + 8} y={yOf(decU) + 17} fontSize="9" fill={NAVY} fillOpacity="0.6">
            upper · all HE+VET
          </text>
          <text x={xOf(12) + 8} y={yOf(decL) + 4} fontSize="11" fontWeight="700" fill={BLUE}>
            {intFmt.format(Math.round(decL))}
          </text>
          <text x={xOf(12) + 8} y={yOf(decL) + 17} fontSize="9" fill={BLUE} fillOpacity="0.75">
            lower · new to Australia
          </text>
          {lastMonth < 12 && (
            <line x1={xOf(lastMonth)} x2={xOf(lastMonth)} y1={M.top} y2={M.top + ih}
              stroke={NAVY} strokeOpacity="0.2" strokeDasharray="2 3" />
          )}
          <text x={M.left} y={H - 4} fontSize="9" fill={NAVY} fillOpacity="0.5">
            magincia.ai · Dept of Education monthly data, Higher Education + VET · NPL: Dept of Education
          </text>
        </svg>
      </figure>

      {canProject && (
        <div className="mt-6 rounded-2xl border border-navy/10 bg-white/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="npl-adj" className="text-base font-semibold text-navy">
              Remaining months ({MONTHS[lastMonth]}–Dec) vs the same months of {year - 1}
            </label>
            <span className="text-sm text-navy/70">
              {adj === null
                ? `Following the year-to-date trend (upper ${pct(ytdYoy("upper"))}, lower ${pct(ytdYoy("lower"))})`
                : `Assumed ${pct(adj)} for both bounds`}
            </span>
          </div>
          <input id="npl-adj" type="range" min={-30} max={30} step={1}
            value={adj ?? Math.round(ytdYoy("upper"))}
            onChange={(e) => setAdj(Number(e.target.value))}
            className="mt-4 w-full accent-[#EA401C]" />
          <div className="mt-1 flex justify-between text-xs text-navy/50">
            <span>−30%</span><span>no change</span><span>+30%</span>
          </div>
          {adj !== null && (
            <button onClick={() => setAdj(null)}
              className="mt-3 text-sm font-semibold text-blue hover:text-vermillion">
              Reset to year-to-date trend
            </button>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2 rounded-xl border-l-4 border-vermillion/60 bg-white/60 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-vermillion">
            {complete ? `${year} outcome` : `On current settings`}
          </p>
          <p className="mt-2 text-sm text-navy/80 leading-relaxed">
            {verdict}{" "}
            {prevPos !== null && decL < target && target < decU && (
              pos > prevPos
                ? `That is higher in the range than in ${year - 1} (${Math.round(prevPos * 100)}%), so relative to what can be measured, the planning level is harder to reach this year.`
                : `That is lower in the range than in ${year - 1} (${Math.round(prevPos * 100)}%), so relative to what can be measured, the planning level is easier to reach this year.`
            )}
          </p>
        </div>
        <div className="rounded-xl border border-navy/10 bg-white/70 p-4 text-sm text-navy/80">
          <p className="font-semibold text-navy">So far, by sector</p>
          <p className="mt-2">Higher Education: {intFmt.format(latest.he)}
            {sectorYoy("he") !== null && <span className="text-navy/60"> ({pct(sectorYoy("he")!)} YoY)</span>}
          </p>
          <p className="mt-1">VET: {intFmt.format(latest.vet)}
            {sectorYoy("vet") !== null && <span className="text-navy/60"> ({pct(sectorYoy("vet")!)} YoY)</span>}
          </p>
          <p className="mt-2 text-xs text-navy/50">All commencements, year-to-date {MONTHS[lastMonth - 1]}.</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-4">
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: accent ?? NAVY }}>{value}</div>
      <div className="mt-1 text-sm text-navy/70">{label}</div>
    </div>
  );
}
