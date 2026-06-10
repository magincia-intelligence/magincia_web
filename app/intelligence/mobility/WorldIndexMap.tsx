"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IndexMapData } from "@/lib/mobility";
import type { WorldMap } from "@/lib/worldmap";

type Axis = "supply" | "demand";

const NO_DATA = "#E4E2DB";
// light → mid → dark ramps per axis (cream-compatible)
const RAMP: Record<Axis, [number, number, number][]> = {
  supply: [
    [234, 240, 246],
    [79, 124, 176],
    [16, 42, 74],
  ],
  demand: [
    [252, 234, 228],
    [234, 64, 28],
    [122, 27, 10],
  ],
};

function rampColor(axis: Axis, v: number): string {
  const t = Math.max(0, Math.min(1, v / 100));
  const [a, b, c] = RAMP[axis];
  const [from, to, tt] = t < 0.5 ? [a, b, t * 2] : [b, c, (t - 0.5) * 2];
  const ch = (i: number) => Math.round(from[i] + (to[i] - from[i]) * tt);
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
}

function gradientCss(axis: Axis): string {
  const stops = [0, 25, 50, 75, 100].map((v) => `${rampColor(axis, v)} ${v}%`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

export default function WorldIndexMap({ map, data }: { map: WorldMap; data: IndexMapData }) {
  const router = useRouter();
  const years = data.years;
  const minY = years[0];
  const maxY = years[years.length - 1];

  const bestYearFor = (axis: Axis): number => {
    let by = maxY, bc = -1;
    for (const y of years) {
      const n = Object.keys(data[axis][y] ?? {}).length;
      if (n > bc) { bc = n; by = y; }
    }
    return by;
  };

  const [axis, setAxis] = useState<Axis>("supply");
  const [year, setYear] = useState<number>(() => bestYearFor("supply"));
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<{ name: string; v: number | null; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setYear((y) => (y >= maxY ? minY : y + 1));
    }, 750);
    return () => clearInterval(id);
  }, [playing, minY, maxY]);

  const layer = useMemo(() => data[axis][year] ?? {}, [data, axis, year]);
  const covered = useMemo(() => {
    // ISO3s with any data in either axis, any year → clickable + counted
    const set = new Set<string>();
    for (const ax of ["supply", "demand"] as Axis[])
      for (const y of years) for (const k of Object.keys(data[ax][y] ?? {})) set.add(k);
    return set;
  }, [data, years]);

  const onMove = (e: React.MouseEvent) => {
    if (!wrapRef.current || !hover) return;
    const r = wrapRef.current.getBoundingClientRect();
    setHover({ ...hover, x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const axisLabel = axis === "supply" ? "Supply" : "Demand";

  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-4 sm:p-6">
      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-navy/15 p-0.5">
          {(["supply", "demand"] as Axis[]).map((a) => (
            <button
              key={a}
              onClick={() => setAxis(a)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${
                axis === a ? "bg-navy text-cream" : "text-navy/60 hover:text-navy"
              }`}
            >
              {a} index
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md border border-navy/15 px-3 py-1.5 text-sm font-semibold text-navy/70 transition hover:border-vermillion hover:text-vermillion"
            aria-pressed={playing}
          >
            {playing ? "❚❚ Pause" : "▶ Play"}
          </button>
          <span className="text-2xl font-semibold tabular-nums text-navy">{year}</span>
        </div>
      </div>

      {/* slider */}
      <input
        type="range"
        min={minY}
        max={maxY}
        step={1}
        value={year}
        onChange={(e) => { setPlaying(false); setYear(Number(e.target.value)); }}
        className="mt-3 h-1 w-full cursor-pointer accent-vermillion"
        aria-label="Year"
      />
      <div className="flex justify-between text-xs text-navy/50">
        <span>{minY}</span>
        <span>{maxY}</span>
      </div>

      {/* map */}
      <div ref={wrapRef} className="relative mt-3" onMouseMove={onMove}>
        <svg viewBox={`0 0 ${map.width} ${map.height}`} className="block w-full"
          role="img" aria-label={`World ${axisLabel.toLowerCase()} index, ${year}`}>
          {map.shapes.map((s) => {
            const v = layer[s.iso3];
            const has = v !== undefined;
            return (
              <path
                key={s.iso3}
                d={s.d}
                fill={has ? rampColor(axis, v) : NO_DATA}
                stroke="#F5EAD7"
                strokeWidth={0.5}
                className={covered.has(s.iso3) ? "cursor-pointer" : ""}
                onMouseEnter={() => setHover({ name: s.name, v: has ? v : null, x: 0, y: 0 })}
                onMouseLeave={() => setHover(null)}
                onClick={() => { if (covered.has(s.iso3)) router.push(`/intelligence/mobility/${s.iso3.toLowerCase()}`); }}
              />
            );
          })}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-navy px-2.5 py-1.5 text-xs text-cream shadow-lg"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <div className="font-semibold">{hover.name}</div>
            <div className="text-cream/80">
              {axisLabel} index:{" "}
              <span className="font-semibold text-cream">{hover.v ?? "no data"}</span>
            </div>
          </div>
        )}
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy/60">Lower</span>
          <div className="h-2.5 w-40 rounded" style={{ background: gradientCss(axis) }} />
          <span className="text-xs text-navy/60">Higher</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-navy/60">
          <span className="inline-block h-2.5 w-4 rounded" style={{ background: NO_DATA }} /> no data
        </div>
        <span className="text-xs text-navy/50">Click a country for its full report.</span>
      </div>
    </div>
  );
}
