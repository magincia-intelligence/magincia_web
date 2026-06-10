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
    // Returns two paths: a solid line between consecutive years, and a dotted
    // line that bridges gaps (so missing years connect, but visibly distinct).
    const lineFor = (key: "supply" | "demand") => {
      const pts = points
        .filter((p) => p[key] !== null)
        .map((p) => ({ x: xOf(p.year), y: yOf(p[key] as number), year: p.year }));
      if (!pts.length) return { solid: "", dotted: "" };
      const dotted = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
      let solid = "";
      for (let i = 1; i < pts.length; i++) {
        if (pts[i].year - pts[i - 1].year === 1) {
          solid += `M${pts[i - 1].x.toFixed(1)},${pts[i - 1].y.toFixed(1)}L${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
        }
      }
      return { solid, dotted };
    };
    const lastOf = (key: "supply" | "demand") => {
      for (let i = points.length - 1; i >= 0; i--) if (points[i][key] !== null) return points[i];
      return null;
    };
    // x ticks ~ every 5 years, always including the last year
    const ticks: number[] = [];
    for (let y = minY; y <= maxY; y++) if (y % 5 === 0) ticks.push(y);
    if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
    return { minY, maxY, span, xOf, yOf, lineFor, lastOf, ticks };
  }, [points]);

  if (!model) {
    return <p className="py-8 text-center text-sm text-navy/60">Not enough history to chart an index.</p>;
  }
  const { minY, maxY, xOf, yOf, lineFor, lastOf, ticks } = model;
  const supLine = lineFor("supply");
  const demLine = lineFor("demand");
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

      {/* lines — dotted bridges gaps, solid between consecutive years */}
      <path d={supLine.dotted} fill="none" stroke={BLUE} strokeWidth="1.75" strokeOpacity="0.65" strokeDasharray="2 3" />
      <path d={supLine.solid} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={demLine.dotted} fill="none" stroke={VERM} strokeWidth="1.75" strokeOpacity="0.65" strokeDasharray="2 3" />
      <path d={demLine.solid} fill="none" stroke={VERM} strokeWidth="2.5" strokeLinejoin="round" />

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
