"use client";

import { useMemo, useState } from "react";
import {
  METRICS, STATES, NATIONAL_CODE, type StatePoint, type MetricUnit,
} from "@/lib/domestic-meta";

const NAVY = "#102238";
const BLUE = "#1E487A";
const VERM = "#EA401C";

const STAGE_LABEL: Record<string, string> = {
  school: "School",
  transition: "Applications & offers",
  university: "University",
};

function fmt(value: number, unit: MetricUnit): string {
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "eftsl") return Math.round(value).toLocaleString();
  return Math.round(value).toLocaleString();
}
function fmtCompact(value: number, unit: MetricUnit): string {
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return Math.round(value).toLocaleString();
}

// ---- bar chart: states at the latest year ------------------------------
const BW = 760, BH = 320, BM = { top: 28, right: 16, bottom: 44, left: 48 };
const binW = BW - BM.left - BM.right, binH = BH - BM.top - BM.bottom;

function StateBars({
  rows, unit, selected, national,
}: {
  rows: { code: string; name: string; value: number }[];
  unit: MetricUnit;
  selected: string;
  national: number | null;
}) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-navy/60">No data.</p>;
  const max = Math.max(...rows.map((r) => r.value), national ?? 0) * 1.08;
  const xOf = (i: number) => BM.left + (i + 0.5) * (binW / rows.length);
  const yOf = (v: number) => BM.top + binH - (v / max) * binH;
  const bw = (binW / rows.length) * 0.62;
  const natY = national != null ? yOf(national) : null;

  return (
    <svg viewBox={`0 0 ${BW} ${BH}`} className="block w-full" role="img"
      aria-label="By-state comparison for the latest year">
      {/* national reference line */}
      {natY != null && (
        <g>
          <line x1={BM.left} y1={natY} x2={BW - BM.right} y2={natY}
            stroke={NAVY} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="4 3" />
          <text x={BW - BM.right} y={natY - 5} textAnchor="end" fontSize="11"
            fill={NAVY} fillOpacity="0.55">Australia {fmt(national!, unit)}</text>
        </g>
      )}
      {rows.map((r, i) => {
        const x = xOf(i), y = yOf(r.value);
        const on = r.code === selected;
        return (
          <g key={r.code}>
            <rect x={x - bw / 2} y={y} width={bw} height={BM.top + binH - y}
              rx="3" fill={on ? VERM : BLUE} fillOpacity={on ? 0.95 : 0.78} />
            <text x={x} y={y - 6} textAnchor="middle" fontSize="11"
              fill={NAVY} fillOpacity="0.8">{fmtCompact(r.value, unit)}</text>
            <text x={x} y={BH - BM.bottom + 18} textAnchor="middle" fontSize="12"
              fontWeight={on ? 700 : 400} fill={NAVY} fillOpacity={on ? 0.95 : 0.7}>
              {r.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- line chart: selected state vs national over time ------------------
const LW = 760, LH = 300, LM = { top: 24, right: 84, bottom: 36, left: 48 };
const linW = LW - LM.left - LM.right, linH = LH - LM.top - LM.bottom;

function TrendLine({
  state, national, unit, stateLabel,
}: {
  state: { year: number; value: number }[];
  national: { year: number; value: number }[];
  unit: MetricUnit;
  stateLabel: string;
}) {
  const model = useMemo(() => {
    const all = [...state, ...national];
    if (all.length < 2) return null;
    const years = all.map((p) => p.year);
    const minY = Math.min(...years), maxY = Math.max(...years);
    const span = Math.max(1, maxY - minY);
    const maxV = Math.max(...all.map((p) => p.value)) * 1.1;
    const xOf = (y: number) => LM.left + ((y - minY) / span) * linW;
    const yOf = (v: number) => LM.top + linH - (v / maxV) * linH;
    const path = (pts: { year: number; value: number }[]) =>
      pts.map((p, i) => `${i ? "L" : "M"}${xOf(p.year).toFixed(1)},${yOf(p.value).toFixed(1)}`).join("");
    const ticks: number[] = [];
    for (let y = minY; y <= maxY; y++) if (y % 5 === 0) ticks.push(y);
    if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
    if (ticks[0] !== minY) ticks.unshift(minY);
    return { minY, maxY, xOf, yOf, path, ticks };
  }, [state, national]);

  if (!model) return <p className="py-8 text-center text-sm text-navy/60">Not enough history to chart.</p>;
  const { xOf, yOf, path, ticks } = model;
  const lastS = state[state.length - 1];
  const lastN = national[national.length - 1];

  return (
    <svg viewBox={`0 0 ${LW} ${LH}`} className="block w-full" role="img"
      aria-label={`${stateLabel} versus Australia over time`}>
      {/* legend */}
      <g>
        <line x1={LM.left} y1={12} x2={LM.left + 22} y2={12} stroke={VERM} strokeWidth="2.5" />
        <text x={LM.left + 28} y={16} fontSize="12" fill={NAVY} fillOpacity="0.78">{stateLabel}</text>
        <line x1={LM.left + 150} y1={12} x2={LM.left + 172} y2={12} stroke={NAVY}
          strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 3" />
        <text x={LM.left + 178} y={16} fontSize="12" fill={NAVY} fillOpacity="0.6">Australia</text>
      </g>
      {ticks.map((t) => (
        <text key={t} x={xOf(t)} y={LH - 12} textAnchor="middle" fontSize="11"
          fill={NAVY} fillOpacity="0.55">{t}</text>
      ))}
      {national.length > 1 && (
        <path d={path(national)} fill="none" stroke={NAVY} strokeOpacity="0.5"
          strokeWidth="2" strokeDasharray="4 3" />
      )}
      {state.length > 1 && <path d={path(state)} fill="none" stroke={VERM} strokeWidth="2.5" />}
      {lastS && <circle cx={xOf(lastS.year)} cy={yOf(lastS.value)} r="3.5" fill={VERM} />}
      {lastS && (
        <text x={xOf(lastS.year) + 8} y={yOf(lastS.value) + 4} fontSize="11" fontWeight={700}
          fill={VERM}>{fmt(lastS.value, unit)}</text>
      )}
      {lastN && (
        <text x={xOf(lastN.year) + 8} y={yOf(lastN.value) + 4} fontSize="11"
          fill={NAVY} fillOpacity="0.6">{fmt(lastN.value, unit)}</text>
      )}
    </svg>
  );
}

// ---- main explorer ------------------------------------------------------
export default function DomesticExplorer({ points }: { points: StatePoint[] }) {
  const [metricKey, setMetricKey] = useState("apparent_retention_y12");
  const [stateCode, setStateCode] = useState("QLD");

  const metric = METRICS.find((m) => m.key === metricKey)!;
  const ofMetric = useMemo(
    () => points.filter((p) => p.metric === metricKey),
    [points, metricKey],
  );

  // latest year that has by-state data for this metric
  const latestYear = useMemo(() => {
    const ys = ofMetric.filter((p) => p.stateCode !== NATIONAL_CODE).map((p) => p.year);
    return ys.length ? Math.max(...ys) : null;
  }, [ofMetric]);

  const barRows = useMemo(() => {
    if (latestYear == null) return [];
    return STATES.map((s) => {
      const pt = ofMetric.find((p) => p.year === latestYear && p.stateCode === s.code);
      return pt ? { code: s.code, name: s.name, value: pt.value } : null;
    }).filter(Boolean) as { code: string; name: string; value: number }[];
  }, [ofMetric, latestYear]);

  const nationalLatest = useMemo(() => {
    if (latestYear == null) return null;
    const pt = ofMetric.find((p) => p.year === latestYear && p.stateCode === NATIONAL_CODE);
    return pt ? pt.value : null;
  }, [ofMetric, latestYear]);

  const stateSeries = useMemo(
    () => ofMetric.filter((p) => p.stateCode === stateCode).sort((a, b) => a.year - b.year)
      .map((p) => ({ year: p.year, value: p.value })),
    [ofMetric, stateCode],
  );
  const nationalSeries = useMemo(
    () => ofMetric.filter((p) => p.stateCode === NATIONAL_CODE).sort((a, b) => a.year - b.year)
      .map((p) => ({ year: p.year, value: p.value })),
    [ofMetric],
  );

  // KPI band: latest value per metric for the selected state
  const kpis = useMemo(() => {
    return METRICS.map((m) => {
      const rows = points.filter((p) => p.metric === m.key && p.stateCode === stateCode);
      if (!rows.length) return null;
      const yr = Math.max(...rows.map((p) => p.year));
      const pt = rows.find((p) => p.year === yr)!;
      return { meta: m, year: yr, value: pt.value };
    }).filter(Boolean) as { meta: typeof METRICS[number]; year: number; value: number }[];
  }, [points, stateCode]);

  const stateName = STATES.find((s) => s.code === stateCode)?.name ?? stateCode;
  const stages = ["school", "transition", "university"] as const;

  return (
    <div className="mt-8">
      {/* state selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">State</span>
        {STATES.map((s) => (
          <button key={s.code} onClick={() => setStateCode(s.code)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              s.code === stateCode ? "bg-vermillion text-cream"
                : "bg-white/70 text-navy/70 hover:bg-white"}`}>
            {s.code}
          </button>
        ))}
      </div>

      {/* KPI band */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {kpis.map((k) => (
          <button key={k.meta.key} onClick={() => setMetricKey(k.meta.key)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              k.meta.key === metricKey ? "border-vermillion/50 bg-white"
                : "border-navy/10 bg-white/60 hover:border-vermillion/30"}`}>
            <div className="text-xs font-medium text-navy/55">{k.meta.short}</div>
            <div className="mt-1 text-2xl font-semibold text-navy">{fmt(k.value, k.meta.unit)}</div>
            <div className="mt-0.5 text-xs text-navy/45">{stateName} · {k.year}</div>
          </button>
        ))}
      </div>

      {/* metric selector */}
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
        {stages.map((st) => (
          <div key={st} className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy/40">{STAGE_LABEL[st]}</span>
            {METRICS.filter((m) => m.stage === st).map((m) => (
              <button key={m.key} onClick={() => setMetricKey(m.key)}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  m.key === metricKey ? "bg-navy text-cream"
                    : "bg-white/60 text-navy/65 hover:bg-white"}`}>
                {m.short}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* charts */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <figure className="rounded-2xl border border-navy/10 bg-white/60 p-5">
          <figcaption className="text-sm font-semibold text-navy">
            {metric.label} by state{latestYear != null ? ` · ${latestYear}` : ""}
          </figcaption>
          <div className="mt-3"><StateBars rows={barRows} unit={metric.unit}
            selected={stateCode} national={nationalLatest} /></div>
        </figure>
        <figure className="rounded-2xl border border-navy/10 bg-white/60 p-5">
          <figcaption className="text-sm font-semibold text-navy">
            {metric.label} over time — {stateName} vs Australia
          </figcaption>
          <div className="mt-3"><TrendLine state={stateSeries} national={nationalSeries}
            unit={metric.unit} stateLabel={stateCode} /></div>
        </figure>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-navy/55">{metric.note}</p>
    </div>
  );
}
