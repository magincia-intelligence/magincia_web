import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The second-semester slide — August 2026 international student data",
  description:
    "The Department of Education's August 2026 release shows the downturn deepening at the mid-year intake: commencements fell 11.7% and enrolments 8.8%, and Higher Education has now joined VET and ELICOS in decline. Home Affairs visa data points to why — the offshore Higher Education grant rate fell from 91% to 80% in 2025–26.",
  alternates: { canonical: "/intelligence/international-education-august-2026" },
};

// Static analysis of the Australian Dept of Education "August 2026 — All Data"
// international-student release (3,627,630 pivot-cache records, loaded to the
// magincia warehouse 15 Nov 2026), read alongside the Home Affairs student visa
// program reports locked at 30 Sep 2026. Every figure below is a verified query
// against the gold marts / education.vw_student_visa_* views. Year-to-date
// measures compare the same month across years.
export const revalidate = false;

const NAVY = "#102238";
const VERM = "#EA401C";
const BLUE = "#1E487A";
const intFmt = new Intl.NumberFormat("en-AU");
const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

// ---- Data (verified against gold.* marts, August year-to-date) -------------
// National YTD enrolments, August, by year.
const ENR_BY_YEAR = [
  { y: 2019, v: 841066 }, { y: 2020, v: 809316 }, { y: 2021, v: 664774 },
  { y: 2022, v: 638748 }, { y: 2023, v: 852796 }, { y: 2024, v: 962420 },
  { y: 2025, v: 949798 }, { y: 2026, v: 866252 },
];
// National YTD commencements (new starts — the leading indicator), August, by year.
const COM_BY_YEAR = [
  { y: 2019, v: 399197 }, { y: 2020, v: 325563 }, { y: 2021, v: 231808 },
  { y: 2022, v: 285110 }, { y: 2023, v: 438924 }, { y: 2024, v: 439221 },
  { y: 2025, v: 370729 }, { y: 2026, v: 327270 },
];
// 2026 year-on-year change at each month's YTD (same month 2025), as published
// in this release (earlier months reflect the Department's revisions).
const MOMENTUM = [
  { m: "Jan", enr: -7.1, com: -9.9 }, { m: "Feb", enr: -7.3, com: -9.2 },
  { m: "Mar", enr: -6.9, com: -6.8 }, { m: "Apr", enr: -7.4, com: -8.6 },
  { m: "May", enr: -7.5, com: -8.9 }, { m: "Jun", enr: -7.8, com: -9.8 },
  { m: "Jul", enr: -9.2, com: -13.1 }, { m: "Aug", enr: -8.8, com: -11.7 },
];
// Sector commencements August 2026 YTD, YoY vs August 2025 (enrolment YoY for context).
const SECTORS = [
  { s: "Higher Education", c: 162902, yoy: -8.8, enrYoy: -0.5 },
  { s: "VET", c: 99335, yoy: -16.3, enrYoy: -19.3 },
  { s: "ELICOS", c: 34377, yoy: -16.7, enrYoy: -24.3 },
  { s: "Non-award", c: 22648, yoy: -2.0, enrYoy: -2.2 },
  { s: "Schools", c: 8008, yoy: -11.3, enrYoy: -7.2 },
];
// Offshore student visa grant rate (granted ÷ decisions), by sector and
// program year (Jul–Jun). Home Affairs BP0015, locked 30 Sep 2026.
const GRANT_RATES = [
  { s: "Higher Education", a: 91.3, b: 79.6, gA: 168235, gB: 142442 },
  { s: "ELICOS", a: 76.1, b: 76.6, gA: 16029, gB: 13544 },
  { s: "VET", a: 53.0, b: 41.7, gA: 11572, gB: 10010 },
  { s: "Schools", a: 85.6, b: 90.7, gA: 8141, gB: 7202 },
  { s: "All offshore", a: 87.7, b: 78.4, gA: 234040, gB: 203384 },
];
// Top source markets, enrolments August 2026, share of national; YoY vs August 2025.
const MARKETS = [
  { c: "China", e: 196876, share: 22.7, yoy: -6.1, cYoy: -12.1 },
  { c: "India", e: 142007, share: 16.4, yoy: -12.5, cYoy: -18.1 },
  { c: "Nepal", e: 74948, share: 8.7, yoy: -3.9, cYoy: -19.8 },
  { c: "Vietnam", e: 38636, share: 4.5, yoy: -8.7, cYoy: -9.9 },
  { c: "Bangladesh", e: 35407, share: 4.1, yoy: 27.4, cYoy: 9.9 },
  { c: "Indonesia", e: 28657, share: 3.3, yoy: 1.5, cYoy: -0.7 },
  { c: "Philippines", e: 27668, share: 3.2, yoy: -36.0, cYoy: -38.8 },
  { c: "Colombia", e: 25413, share: 2.9, yoy: -27.8, cYoy: -35.1 },
  { c: "Pakistan", e: 24235, share: 2.8, yoy: -11.8, cYoy: 2.5 },
  { c: "Brazil", e: 21762, share: 2.5, yoy: -16.6, cYoy: -15.9 },
  { c: "Sri Lanka", e: 21680, share: 2.5, yoy: -6.9, cYoy: -16.7 },
  { c: "Thailand", e: 19473, share: 2.2, yoy: -25.1, cYoy: -28.4 },
];
// Enrolments by state, August 2026, YoY vs August 2025 (commencement YoY as sub).
const STATES = [
  { s: "NSW", e: 327613, yoy: -8.8, cYoy: -12.8 }, { s: "VIC", e: 265855, yoy: -8.5, cYoy: -11.3 },
  { s: "QLD", e: 119897, yoy: -9.5, cYoy: -11.7 }, { s: "WA", e: 75701, yoy: -7.3, cYoy: -7.0 },
  { s: "SA", e: 45908, yoy: -11.3, cYoy: -14.8 }, { s: "ACT", e: 17577, yoy: -13.2, cYoy: -16.9 },
  { s: "TAS", e: 8242, yoy: -2.6, cYoy: 3.9 }, { s: "NT", e: 5459, yoy: 0.1, cYoy: -18.6 },
];

// ---- Chart: vertical yearly bars, latest year highlighted ------------------
function YearBars({ data, yLabel, ariaLabel, peakYear }: {
  data: { y: number; v: number }[]; yLabel: string; ariaLabel: string; peakYear?: number;
}) {
  const W = 760, H = 360, M = { top: 28, right: 24, bottom: 44, left: 60 };
  const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
  const max = Math.max(...data.map((d) => d.v));
  const band = iw / data.length;
  const barW = Math.min(band * 0.6, 62);
  const yOf = (v: number) => M.top + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const latest = data[data.length - 1].y;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img" aria-label={ariaLabel}>
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={M.left} x2={W - M.right} y1={yOf(t)} y2={yOf(t)} stroke={NAVY} strokeOpacity="0.08" />
          <text x={M.left - 8} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill={NAVY} fillOpacity="0.6">
            {intFmt.format(t)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = M.left + (i + 0.5) * band;
        const y = yOf(d.v);
        const isLatest = d.y === latest;
        const isPeak = d.y === peakYear;
        return (
          <g key={d.y}>
            <rect x={cx - barW / 2} y={y} width={barW} height={M.top + ih - y}
              fill={isLatest ? VERM : isPeak ? BLUE : NAVY}
              fillOpacity={isLatest ? 1 : isPeak ? 0.7 : 0.3} rx="2" />
            <text x={cx} y={y - 6} textAnchor="middle" fontSize={isLatest ? "13" : "11"}
              fontWeight={isLatest ? 700 : 400} fill={isLatest ? VERM : NAVY} fillOpacity={isLatest ? 1 : 0.7}>
              {intFmt.format(d.v)}
            </text>
            <text x={cx} y={M.top + ih + 18} textAnchor="middle" fontSize="11" fill={NAVY} fillOpacity="0.6">
              {d.y}
            </text>
          </g>
        );
      })}
      <text transform={`translate(16, ${M.top + ih / 2}) rotate(-90)`} textAnchor="middle"
        fontSize="11" fontWeight="600" fill={NAVY} fillOpacity="0.6">{yLabel}</text>
      <text x={W - M.right} y={H - 6} textAnchor="end" fontSize="9" fill={NAVY} fillOpacity="0.5">
        magincia.ai · Source: Dept of Education · August year-to-date
      </text>
    </svg>
  );
}

// ---- Chart: 2026 YoY momentum, enrolments vs commencements by month --------
function MomentumChart() {
  const W = 760, H = 320, M = { top: 28, right: 160, bottom: 40, left: 52 };
  const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
  const lo = -15, hi = 0;
  const xOf = (i: number) => M.left + (i / (MOMENTUM.length - 1)) * iw;
  const yOf = (v: number) => M.top + ((hi - v) / (hi - lo)) * ih;
  const path = (k: "enr" | "com") =>
    MOMENTUM.map((d, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(d[k]).toFixed(1)}`).join(" ");
  const last = MOMENTUM.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label="Year-on-year change in 2026 enrolments and commencements, by month of year-to-date">
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      {[0, -5, -10, -15].map((t) => (
        <g key={t}>
          <line x1={M.left} x2={W - M.right} y1={yOf(t)} y2={yOf(t)} stroke={NAVY}
            strokeOpacity={t === 0 ? 0.3 : 0.08} />
          <text x={M.left - 8} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill={NAVY} fillOpacity="0.6">
            {t}%
          </text>
        </g>
      ))}
      {/* Mid-year intake */}
      <rect x={xOf(5.5)} y={M.top} width={xOf(7) - xOf(5.5)} height={ih} fill={VERM} fillOpacity="0.06" />
      <text x={xOf(6.25)} y={M.top - 8} textAnchor="middle" fontSize="10" fill={VERM} fillOpacity="0.8">
        Semester 2 intake
      </text>
      <path d={path("enr")} fill="none" stroke={NAVY} strokeOpacity="0.55" strokeWidth="2.5" />
      <path d={path("com")} fill="none" stroke={VERM} strokeWidth="3" />
      {MOMENTUM.map((d, i) => (
        <g key={d.m}>
          <circle cx={xOf(i)} cy={yOf(d.enr)} r="3" fill={NAVY} fillOpacity="0.55" />
          <circle cx={xOf(i)} cy={yOf(d.com)} r="3.5" fill={VERM} />
          <text x={xOf(i)} y={M.top + ih + 18} textAnchor="middle" fontSize="11" fill={NAVY} fillOpacity="0.6">
            {d.m}
          </text>
        </g>
      ))}
      <text x={xOf(last) + 10} y={yOf(MOMENTUM[last].enr) + 4} fontSize="12" fontWeight="600"
        fill={NAVY} fillOpacity="0.75">Enrolments {pct(MOMENTUM[last].enr)}</text>
      <text x={xOf(last) + 10} y={yOf(MOMENTUM[last].com) + 4} fontSize="12" fontWeight="700"
        fill={VERM}>Commencements {pct(MOMENTUM[last].com)}</text>
      <text x={M.left} y={H - 4} fontSize="9" fill={NAVY} fillOpacity="0.5">
        magincia.ai · YoY % of each month&apos;s year-to-date, 2026 vs 2025 · August 2026 release
      </text>
    </svg>
  );
}

// ---- Chart: horizontal diverging YoY% bars (sectors / states) --------------
// The bar carries direction + magnitude off a central zero line; the numeric
// value lives in a fixed right-hand column so it can never overlap the category
// labels, however long the bar. The left column carries label + optional sub.
function DivergingBars({ rows, ariaLabel, note }: {
  rows: { label: string; yoy: number; sub?: string }[]; ariaLabel: string; note: string;
}) {
  const sorted = [...rows].sort((a, b) => b.yoy - a.yoy);
  const W = 760, rowH = 42, M = { top: 16, right: 66, bottom: 28, left: 150 };
  const H = M.top + sorted.length * rowH + M.bottom;
  const iw = W - M.left - M.right;
  const maxAbs = Math.max(...sorted.map((r) => Math.abs(r.yoy))) * 1.15;
  const xOf = (v: number) => M.left + (iw * (v + maxAbs)) / (2 * maxAbs);
  const zero = xOf(0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img" aria-label={ariaLabel}>
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      <line x1={zero} x2={zero} y1={M.top} y2={M.top + sorted.length * rowH} stroke={NAVY} strokeOpacity="0.25" />
      {sorted.map((r, i) => {
        const top = M.top + i * rowH;
        const mid = top + rowH / 2;
        const pos = r.yoy >= 0;
        const x0 = pos ? zero : xOf(r.yoy);
        const w = Math.abs(xOf(r.yoy) - zero);
        return (
          <g key={r.label}>
            <text x={M.left - 14} y={r.sub ? mid : mid + 4} textAnchor="end" fontSize="12"
              fill={NAVY} fillOpacity="0.85">{r.label}</text>
            {r.sub && (
              <text x={M.left - 14} y={mid + 14} textAnchor="end" fontSize="9"
                fill={NAVY} fillOpacity="0.45">{r.sub}</text>
            )}
            <rect x={x0} y={top + 10} width={w} height={rowH - 20} rx="2"
              fill={pos ? BLUE : VERM} fillOpacity={pos ? 0.75 : 0.95} />
            <text x={W - 12} y={mid + 4} textAnchor="end" fontSize="12" fontWeight="700"
              fill={pos ? BLUE : VERM}>
              {pct(r.yoy)}
            </text>
          </g>
        );
      })}
      <text x={M.left} y={H - 4} textAnchor="start" fontSize="9" fill={NAVY} fillOpacity="0.5">
        {note}
      </text>
    </svg>
  );
}

// ---- Chart: offshore visa grant rate, 2024–25 → 2025–26 dumbbells ----------
function GrantRateDumbbells() {
  const rows = GRANT_RATES;
  const W = 760, rowH = 46, M = { top: 30, right: 150, bottom: 28, left: 150 };
  const H = M.top + rows.length * rowH + M.bottom;
  const iw = W - M.left - M.right;
  const lo = 30, hi = 100;
  const xOf = (v: number) => M.left + ((v - lo) / (hi - lo)) * iw;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label="Offshore student visa grant rate by sector, 2024–25 compared with 2025–26">
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      {[40, 60, 80, 100].map((t) => (
        <g key={t}>
          <line x1={xOf(t)} x2={xOf(t)} y1={M.top - 6} y2={M.top + rows.length * rowH}
            stroke={NAVY} strokeOpacity="0.08" />
          <text x={xOf(t)} y={M.top - 12} textAnchor="middle" fontSize="10" fill={NAVY} fillOpacity="0.55">
            {t}%
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const mid = M.top + i * rowH + rowH / 2;
        const fell = r.b < r.a;
        const total = r.s === "All offshore";
        const gChg = 100 * (r.gB / r.gA - 1);
        return (
          <g key={r.s}>
            {total && (
              <line x1={16} x2={W - 16} y1={mid - rowH / 2} y2={mid - rowH / 2} stroke={NAVY} strokeOpacity="0.15" />
            )}
            <text x={M.left - 14} y={mid + 4} textAnchor="end" fontSize="12"
              fontWeight={total ? 700 : 400} fill={NAVY} fillOpacity="0.85">{r.s}</text>
            <line x1={xOf(r.a)} x2={xOf(r.b)} y1={mid} y2={mid} stroke={fell ? VERM : BLUE}
              strokeOpacity="0.45" strokeWidth="4" />
            <circle cx={xOf(r.a)} cy={mid} r="6" fill="#ffffff" stroke={NAVY} strokeOpacity="0.5" strokeWidth="2" />
            <circle cx={xOf(r.b)} cy={mid} r="7" fill={fell ? VERM : BLUE} />
            <text x={W - M.right + 14} y={mid} fontSize="12" fontWeight="700" fill={fell ? VERM : BLUE}>
              {r.a.toFixed(1)}% → {r.b.toFixed(1)}%
            </text>
            <text x={W - M.right + 14} y={mid + 14} fontSize="9" fill={NAVY} fillOpacity="0.5">
              grants {pct(gChg)}
            </text>
          </g>
        );
      })}
      <text x={M.left} y={H - 4} fontSize="9" fill={NAVY} fillOpacity="0.5">
        ○ 2024–25 · ● 2025–26 · grant rate = grants ÷ decisions, applicants outside Australia · Home Affairs BP0015
      </text>
    </svg>
  );
}

// ---- Chart: source markets — enrolment size bar + YoY labels ----------------
function MarketBars() {
  const rows = MARKETS;
  const W = 760, rowH = 34, M = { top: 30, right: 210, bottom: 26, left: 96 };
  const H = M.top + rows.length * rowH + M.bottom;
  const iw = W - M.left - M.right;
  const max = Math.max(...rows.map((r) => r.e));
  const xOf = (v: number) => (v / max) * iw;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label="Top international student source markets, enrolments and year-on-year change">
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      <text x={W - 78} y={M.top - 10} textAnchor="end" fontSize="9" fontWeight="600" fill={NAVY} fillOpacity="0.55">
        Enrol.
      </text>
      <text x={W - 8} y={M.top - 10} textAnchor="end" fontSize="9" fontWeight="600" fill={NAVY} fillOpacity="0.55">
        Commence.
      </text>
      {rows.map((r, i) => {
        const top = M.top + i * rowH;
        const bh = rowH - 14;
        const grew = r.yoy >= 0;
        return (
          <g key={r.c}>
            <text x={M.left - 10} y={top + rowH / 2 + 4} textAnchor="end" fontSize="12"
              fill={NAVY} fillOpacity="0.85">{r.c}</text>
            <rect x={M.left} y={top + 7} width={xOf(r.e)} height={bh} rx="2"
              fill={grew ? BLUE : NAVY} fillOpacity={grew ? 0.7 : 0.4} />
            <text x={M.left + xOf(r.e) + 6} y={top + rowH / 2 + 4} fontSize="11"
              fill={NAVY} fillOpacity="0.75">
              {intFmt.format(r.e)}
            </text>
            <text x={W - 78} y={top + rowH / 2 + 4} textAnchor="end" fontSize="11" fontWeight="700"
              fill={grew ? BLUE : VERM}>
              {pct(r.yoy)}
            </text>
            <text x={W - 8} y={top + rowH / 2 + 4} textAnchor="end" fontSize="11" fontWeight="700"
              fill={r.cYoy >= 0 ? BLUE : VERM} fillOpacity="0.8">
              {pct(r.cYoy)}
            </text>
          </g>
        );
      })}
      <text x={M.left} y={H - 4} textAnchor="start" fontSize="9" fill={NAVY} fillOpacity="0.5">
        Bar = enrolments (August 2026 YTD) · right = YoY vs August 2025
      </text>
    </svg>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-4">
      <div className="text-3xl font-semibold tracking-tight" style={{ color: accent ?? NAVY }}>{value}</div>
      <div className="mt-1 text-sm text-navy/70">{label}</div>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <figure className="mt-6 rounded-2xl border border-navy/10 bg-white/70 p-5 sm:p-6">
      <figcaption className="mb-2">
        <h3 className="text-base font-semibold text-navy">{title}</h3>
        {sub && <p className="mt-0.5 text-sm text-navy/60">{sub}</p>}
      </figcaption>
      {children}
    </figure>
  );
}

export default function AugustReleaseAnalysisPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-navy px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        Release Analysis · August 2026
      </span>

      <h1 className="mt-6 max-w-3xl text-3xl sm:text-5xl font-semibold tracking-tight text-navy">
        The second-semester slide
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-navy/80 leading-snug">
        In May we reported that the boom had turned. The August 2026 release shows the turn gathering pace at the
        mid-year intake. New <strong>commencements</strong> are down 11.7% on a year earlier, and{" "}
        <strong>enrolments</strong>{" "}are down 8.8%. Higher Education, the one sector that had been holding up, has now
        joined the decline. Home Affairs visa data points to why: in 2025&ndash;26 the share of offshore Higher
        Education visa applications that were granted fell from 91% to 80%.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value="866,252" label="International enrolments, August 2026 YTD" />
        <Stat value="−8.8%" label="Enrolments year-on-year (−7.5% at May)" accent={VERM} />
        <Stat value="327,270" label="Commencements (new starts), August 2026 YTD" />
        <Stat value="−11.7%" label="Commencements year-on-year (−8.9% at May)" accent={VERM} />
      </div>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        The mid-year intake made it worse
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Through the first half of 2026 the year-on-year gap was steady: enrolments ran about 7% below 2025 and
        commencements 7&ndash;10% below. Then came the semester-two intake. July&rsquo;s year-to-date commencements
        fell to <strong>13.1% below</strong> the previous July, and August sits at 11.7% below. Mid-year is the
        second-largest intake of the year, so the fact that it was weaker than the already-soft first semester
        tells us the slowdown is still accelerating, not levelling off.
      </p>

      <ChartCard
        title="2026 versus 2025, month by month (year-to-date)"
        sub="The gap was steady through June, then widened at the semester-two intake.">
        <MomentumChart />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        Commencements are now below pre-pandemic levels
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Commencements by August, the measure that leads, were 439,221 in 2024. They have now fallen two years in a
        row, to 327,270. That is <strong>25% below the 2024 peak</strong> and <strong>18% below August
        2019</strong>, before the pandemic. Of the years shown, only 2020&ndash;22, when the borders were closed or
        just reopening, were lower. The total enrolment count (866,252) is still above 2019 because students
        already part-way through multi-year courses keep it up. But that cushion shrinks as each smaller intake
        replaces a larger graduating one.
      </p>

      <ChartCard
        title="National commencements, August year-to-date"
        sub="Blue marks the 2024 peak; red is August 2026, below the 2019 pre-pandemic level.">
        <YearBars data={COM_BY_YEAR} peakYear={2024} yLabel="Commencements (Aug YTD)"
          ariaLabel="National international student commencements by year, August year-to-date" />
      </ChartCard>

      <ChartCard
        title="National international enrolments, August year-to-date"
        sub="Enrolments carry forward continuing students, so they lag. They are now 10% below the 2024 peak.">
        <YearBars data={ENR_BY_YEAR} peakYear={2024} yLabel="Enrolments (Aug YTD)"
          ariaLabel="National international student enrolments by year, August year-to-date" />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        Higher Education has joined the decline
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        In May, Higher Education was the only sector that appeared to be growing. By August, its enrolments are{" "}
        <strong>down 0.5%</strong> and its commencements <strong>down 8.8%</strong>, about 15,700 fewer new students
        than a year earlier, second only to VET (about 19,300 fewer). VET (−16.3%) and ELICOS (−16.7%) still have
        the steepest percentage falls. The decline is no longer limited to the pathway sectors, though; the university intake is now shrinking
        too.
      </p>

      <ChartCard
        title="Commencement change by sector — August 2025 → August 2026"
        sub="Every sector is starting fewer students; Higher Education is now firmly negative.">
        <DivergingBars
          rows={SECTORS.map((s) => ({
            label: s.s, yoy: s.yoy,
            sub: `${intFmt.format(s.c)} commencements · enrolments ${pct(s.enrYoy)}`,
          }))}
          ariaLabel="Year-on-year commencement change by sector, August 2026"
          note="magincia.ai · YoY % of August-YTD commencements" />
      </ChartCard>

      <div className="mt-6 max-w-3xl rounded-xl border-l-4 border-vermillion/60 bg-white/60 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-vermillion">The Adelaide merger still matters</p>
        <p className="mt-2 text-sm text-navy/80 leading-relaxed">
          The comparability break from the Adelaide University merger, which we covered in May, still applies.
          On 1 January 2026, continuing students at the two old universities moved to a single new provider.
          This inflates how many Higher Education students are counted as starting in 2026, especially in
          research. The true fall in Higher Education commencements is therefore probably <em>deeper</em> than
          8.8%. See the{" "}
          <Link href="/intelligence/sa-commencement-anomaly" className="font-semibold text-vermillion hover:underline">
            South Australian commencement anomaly
          </Link>{" "}
          case study for details.
        </p>
      </div>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        The visa data shows why
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Students can&rsquo;t start a course without a visa, so visa grants are where the commencement numbers are
        decided. The Home Affairs program reports for 2025&ndash;26 (July to June, covering the visas for the
        mid-2026 intake) show the change clearly. For applicants outside Australia, the{" "}
        <strong>Higher Education grant rate fell from 91.3% to 79.6%</strong>, and the number of offshore Higher
        Education grants fell 15.3%. VET, already the hardest sector to get a visa for, fell from 53% to 42%.
        Across all sectors, offshore grants fell 13.1%, to 203,384. Applications fell only 4.4% (408,385 student
        visa applications in 2025&ndash;26). So demand has eased, but the bigger driver is that a larger share of
        applications is being refused.
      </p>

      <ChartCard
        title="Offshore student visa grant rate by sector, 2024–25 → 2025–26"
        sub="The Higher Education grant rate fell by almost 12 percentage points in a single program year.">
        <GrantRateDumbbells />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        Where the students come from
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        The two biggest markets are now contributing to the decline. <strong>India</strong> is down 12.5% in
        enrolments and 18.1% in commencements, and <strong>China</strong>, which held steady in May, has
        commencements down 12.1%. Nepal is the clearest early warning: its enrolments are down only 3.9%, but its
        commencements are down <strong>19.8%</strong>, so the continuing-student base is hiding a sharp fall in new
        students. The pathway markets are still falling fastest: the Philippines, Colombia and Thailand are all
        down 25&ndash;36%. <strong>Bangladesh</strong> is again the main exception (+27.4% enrolments), and Pakistan
        and Korea are starting slightly more students than a year ago.
      </p>

      <ChartCard
        title="Top 12 source markets — enrolments and year-on-year change"
        sub="Bars sized by August 2026 enrolments; the right-hand column shows commencements, the leading signal.">
        <MarketBars />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        Every major state is down
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        The three largest states are falling together: NSW −8.8%, Victoria −8.5% and Queensland −9.5%. The ACT
        (−13.2%) and South Australia (−11.3%, affected by the merger) are down the most. Tasmania and the Northern
        Territory are again roughly flat, but the NT&rsquo;s commencements are down 18.6%, so its flat enrolment
        figure will probably not last.
      </p>

      <ChartCard
        title="Enrolment change by state — August 2025 → August 2026"
        sub="The decline is national; sub-labels show the commencement change.">
        <DivergingBars
          rows={STATES.map((s) => ({
            label: s.s, yoy: s.yoy,
            sub: `${intFmt.format(s.e)} enrolments · commencements ${pct(s.cYoy)}`,
          }))}
          ariaLabel="Year-on-year enrolment change by state, August 2026"
          note="magincia.ai · YoY % of August-YTD enrolments" />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">The takeaway</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        In May the decline looked targeted: VET, ELICOS and the mid-tier source countries that feed them, with
        Higher Education apparently unaffected. The August release changes that picture. Higher Education
        commencements are down 8.8%, the gap widened at the mid-year intake, and the two biggest source markets
        are now in clear decline. The visa data explains the shift: the share of offshore university applications
        that are granted is now back below its 2023&ndash;24 level (79.6% against 80.9%). Commencements are now below 2019, and
        2025&ndash;26 grants are still falling, so the enrolment decline should continue into 2027. The first
        2026&ndash;27 visa figures, to 30 September, will show whether the pressure on grants is easing.
      </p>

      <footer className="mt-12 border-t border-navy/10 pt-6 text-sm text-navy/60">
        <p className="max-w-3xl">
          <strong className="text-navy/70">Method &amp; sources.</strong> Enrolment and commencement figures come
          from the Australian Department of Education &ldquo;August 2026 &mdash; All Data&rdquo; international-student
          release (3,627,630 records), loaded to the magincia warehouse on 15 November 2026 and modelled through its
          silver and gold layers. All measures are <em>year-to-date to August</em> and compare the same month across
          years, following the Department&rsquo;s{" "}
          <a className="text-vermillion hover:underline"
            href="https://www.education.gov.au/international-education-data-and-research/explanatory-notes-data-relating-international-students-studying-australia">
            explanatory notes
          </a>. The Department revises earlier months in each release, so May 2026 figures here may differ
          slightly from our May analysis. Source listing:{" "}
          <a className="text-vermillion hover:underline"
            href="https://www.education.gov.au/international-education-data-and-research/international-student-monthly-summary-and-data-tables">
            international student monthly summary and data tables
          </a>. Visa figures come from the Department of Home Affairs{" "}
          <a className="text-vermillion hover:underline" href="https://data.gov.au/data/dataset/324aa4f7-46bb-4d56-bc2d-772333a2317e">
            student visa program reports
          </a>{" "}
          (BP0015, locked 30 September 2026), by program year (July&ndash;June). The grant rate is grants divided
          by decisions, for applicants outside Australia, by the sector of the applicant&rsquo;s main course. Counts
          below 5 are suppressed under the de-identification rule; none occur at the level of detail shown. Every
          figure can be traced to its source file through the magincia lineage layer.
        </p>
        <p className="mt-3 font-semibold text-vermillion">magincia.ai</p>
      </footer>
    </main>
  );
}
