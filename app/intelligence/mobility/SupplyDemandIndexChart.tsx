"use client";

import { useMemo, useRef, useState } from "react";
import type { IndexPoint } from "@/lib/mobility";

const NAVY = "#102238";
const BLUE = "#1E487A";
const VERM = "#EA401C";
const CREAM = "#F5EAD7";

const W = 760;
const H = 360;
const M = { top: 34, right: 92, bottom: 40, left: 40 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;

export default function SupplyDemandIndexChart({ points }: { points: IndexPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  const model = useMemo(() => {
    if (points.length < 2) return null;
    const years = points.map((p) => p.year);
    const minY = years[0];
    const maxY = years[years.length - 1];
    const span = Math.max(1, maxY - minY);
    const xOf = (y: number) => M.left + ((y - minY) / span) * innerW;
    const yOf = (v: number) => M.top + innerH - (v / 100) * innerH;
    const pathFor = (key: "supply" | "demand") => {
      let d = "", started = false;
      for (const p of points) {
        const v = p[key];
        if (v === null) { started = false; continue; }
        d += `${started ? "L" : "M"}${xOf(p.year).toFixed(1)},${yOf(v).toFixed(1)}`;
        started = true;
      }
      return d;
    };
    const lastOf = (key: "supply" | "demand") => {
      for (let i = points.length - 1; i >= 0; i--) if (points[i][key] !== null) return points[i];
      return null;
    };
    // x ticks ~ every 5 years, always including the last year
    const ticks: number[] = [];
    for (let y = minY; y <= maxY; y++) if (y % 5 === 0) ticks.push(y);
    if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
    return { minY, maxY, span, xOf, yOf, pathFor, lastOf, ticks };
  }, [points]);

  if (!model) {
    return <p className="py-8 text-center text-sm text-navy/60">Not enough history to chart an index.</p>;
  }
  const { minY, maxY, xOf, yOf, pathFor, lastOf, ticks } = model;
  const lastS = lastOf("supply");
  const lastD = lastOf("demand");
  const hovered = hoverYear === null ? null : points.find((p) => p.year === hoverYear) ?? null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    const yr = Math.round(minY + ((vbX - M.left) / innerW) * (maxY - minY));
    setHoverYear(Math.min(maxY, Math.max(minY, yr)));
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label="Supply and demand index over time"
      onMouseMove={onMove}
      onMouseLeave={() => setHoverYear(null)}
    >
      {/* legend */}
      <g>
        <line x1={M.left} y1={16} x2={M.left + 22} y2={16} stroke={BLUE} strokeWidth="2.5" />
        <text x={M.left + 28} y={20} fontSize="12" fill={NAVY} fillOpacity="0.75">Supply index</text>
        <line x1={M.left + 130} y1={16} x2={M.left + 152} y2={16} stroke={VERM} strokeWidth="2.5" />
        <text x={M.left + 158} y={20} fontSize="12" fill={NAVY} fillOpacity="0.75">Demand index</text>
      </g>

      {/* y gridlines 0..100 */}
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={M.left} x2={W - M.right} y1={yOf(v)} y2={yOf(v)} stroke={NAVY} strokeOpacity="0.08" />
          <text x={M.left - 8} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill={NAVY} fillOpacity="0.55">{v}</text>
        </g>
      ))}

      {/* x ticks */}
      {ticks.map((y) => (
        <text key={y} x={xOf(y)} y={M.top + innerH + 18} textAnchor="middle" fontSize="11" fill={NAVY} fillOpacity="0.55">{y}</text>
      ))}

      {/* lines */}
      <path d={pathFor("supply")} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={pathFor("demand")} fill="none" stroke={VERM} strokeWidth="2.5" strokeLinejoin="round" />

      {/* end labels */}
      {lastS && lastS.supply !== null && (
        <text x={xOf(lastS.year) + 6} y={yOf(lastS.supply) + 4} fontSize="12" fontWeight="700" fill={BLUE}>{lastS.supply}</text>
      )}
      {lastD && lastD.demand !== null && (
        <text x={xOf(lastD.year) + 6} y={yOf(lastD.demand) + 4} fontSize="12" fontWeight="700" fill={VERM}>{lastD.demand}</text>
      )}

      {/* hover */}
      {hovered && (
        <g>
          <line x1={xOf(hovered.year)} x2={xOf(hovered.year)} y1={M.top} y2={M.top + innerH}
            stroke={NAVY} strokeOpacity="0.25" strokeDasharray="3 3" />
          {hovered.supply !== null && <circle cx={xOf(hovered.year)} cy={yOf(hovered.supply)} r="3.5" fill={BLUE} />}
          {hovered.demand !== null && <circle cx={xOf(hovered.year)} cy={yOf(hovered.demand)} r="3.5" fill={VERM} />}
          <g transform={`translate(${Math.min(xOf(hovered.year) + 8, W - M.right - 96)}, ${M.top + 4})`}>
            <rect width="120" height="58" rx="4" fill={NAVY} />
            <text x="8" y="17" fontSize="11" fill={CREAM} fillOpacity="0.7">{hovered.year}</text>
            <text x="8" y="34" fontSize="12" fill="#9DBBDD">Supply {hovered.supply ?? "—"}</text>
            <text x="8" y="50" fontSize="12" fill="#F4A28C">Demand {hovered.demand ?? "—"}</text>
          </g>
        </g>
      )}
    </svg>
  );
}
