import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The South Australian Commencement Anomaly — How a University Merger Inflated a Statistic",
  description:
    "A February 2026 case study: international Higher Degree by Research commencements in South Australia jumped roughly tenfold while genuine new-student arrivals fell. The cause is the Adelaide University merger re-commencing continuing students — a system-wide statistical artifact, not growth. The same mechanism double-counts enrolments: the YTD measure counts both the legacy and the new Adelaide University enrolment for every transferred student.",
  alternates: { canonical: "/intelligence/sa-commencement-anomaly" },
};

// Static case study — figures are a fixed snapshot from the Australian Dept of
// Education "February 2026 — Latest Data" international-student release, cross-
// referenced with Dept of Home Affairs student-visa data. Counts under 5 are
// perturbed to "<5" per the de-identification rule; none appear at this grain.
export const revalidate = false;

const NAVY = "#102238";
const VERM = "#EA401C";
const BLUE = "#1E487A";
const CREAM = "#F5EAD7";
const intFmt = new Intl.NumberFormat("en-AU");

// ---- Data (verified against the warehouse) --------------------------------
// SA Higher Education RESEARCH commencements (Doctoral + Masters by Research),
// February YTD, by year.
const RESEARCH_BY_YEAR = [
  { y: 2019, v: 66 }, { y: 2020, v: 72 }, { y: 2021, v: 47 }, { y: 2022, v: 140 },
  { y: 2023, v: 115 }, { y: 2024, v: 152 }, { y: 2025, v: 143 }, { y: 2026, v: 1466 },
];

// SA Higher Education RESEARCH ENROLMENTS (Doctoral + Masters by Research),
// February YTD, by year. The 2026 figure double-counts transferred students:
// the YTD measure counts every enrolment active in the window, and merger
// students had both a legacy CoE and a new Adelaide University CoE.
const RESEARCH_ENR_BY_YEAR = [
  { y: 2019, v: 833 }, { y: 2020, v: 855 }, { y: 2021, v: 742 }, { y: 2022, v: 841 },
  { y: 2023, v: 1001 }, { y: 2024, v: 1229 }, { y: 2025, v: 1424 }, { y: 2026, v: 3021 },
];

// SA research enrolments by broad field of education, Feb YTD. The merger CoEs
// were issued under a generic "Mixed Field Programmes" CRICOS classification;
// every genuine discipline is roughly flat. "Other fields" = Architecture &
// Building, Education, Agriculture, Creative Arts, Dual Qualification.
const ENR_BY_FIELD = [
  { field: "Mixed Field Programmes", e25: 12, e26: 1403 },
  { field: "Engineering & Related Tech", e25: 392, e26: 409 },
  { field: "Society & Culture", e25: 187, e26: 324 },
  { field: "Natural & Physical Sciences", e25: 295, e26: 302 },
  { field: "Health", e25: 210, e26: 252 },
  { field: "Information Technology", e25: 122, e26: 120 },
  { field: "Management & Commerce", e25: 107, e26: 99 },
  { field: "Other fields", e25: 99, e26: 112 },
];

// SA Higher Education commencements by level of study, Feb YTD, split into
// continuing (already onshore, new_to_australia = No) vs genuinely new arrivals.
const BY_LEVEL = [
  { level: "Masters (Coursework)", onshore25: 589, onshore26: 1370, new25: 1415, new26: 722 },
  { level: "Bachelor", onshore25: 771, onshore26: 1073, new25: 770, new26: 415 },
  { level: "Doctoral", onshore25: 47, onshore26: 1211, new25: 61, new26: 138 },
  { level: "Bachelor Honours", onshore25: 136, onshore26: 205, new25: 122, new26: 137 },
  { level: "Masters (Research)", onshore25: 26, onshore26: 112, new25: 9, new26: 5 },
  { level: "Diploma", onshore25: 77, onshore26: 57, new25: 113, new26: 81 },
];

// By-state ONSHORE (continuing) HE commencement change, Feb 2025 -> 2026.
// Shows the artifact is a South Australian event, not a national trend.
const BY_STATE_ONSHORE = [
  { state: "SA", a: 1707, b: 4152 }, { state: "VIC", a: 4751, b: 5322 },
  { state: "ACT", a: 818, b: 979 }, { state: "WA", a: 2803, b: 2900 },
  { state: "QLD", a: 3899, b: 3905 }, { state: "NSW", a: 13647, b: 13086 },
];

// SA postgraduate-research student visa grants (Dept of Home Affairs), full FY.
const RESEARCH_VISAS = [
  { fy: "2019-20", v: 452 }, { fy: "2020-21", v: 515 }, { fy: "2021-22", v: 531 },
  { fy: "2022-23", v: 1033 }, { fy: "2023-24", v: 717 }, { fy: "2024-25", v: 839 },
];

// ---- Chart 1: vertical bars, a yearly series with the 2026 bar highlighted --
function YearSpikeChart({ data, yLabel, ariaLabel }: {
  data: { y: number; v: number }[]; yLabel: string; ariaLabel: string;
}) {
  const W = 760, H = 380, M = { top: 24, right: 24, bottom: 44, left: 56 };
  const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
  const max = Math.max(...data.map((d) => d.v));
  const n = data.length;
  const band = iw / n;
  const barW = Math.min(band * 0.62, 56);
  const yOf = (v: number) => M.top + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label={ariaLabel}>
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
        const isCur = d.y === 2026;
        return (
          <g key={d.y}>
            <rect x={cx - barW / 2} y={y} width={barW} height={M.top + ih - y}
              fill={isCur ? VERM : NAVY} fillOpacity={isCur ? 1 : 0.32} rx="2" />
            <text x={cx} y={y - 6} textAnchor="middle" fontSize={isCur ? "13" : "11"}
              fontWeight={isCur ? 700 : 400} fill={isCur ? VERM : NAVY} fillOpacity={isCur ? 1 : 0.7}>
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
        magincia.ai · Source: Dept of Education
      </text>
    </svg>
  );
}

// ---- Chart 2: grouped horizontal bars, continuing commencements 25 vs 26 ----
function ContinuingByLevelChart() {
  const rows = BY_LEVEL;
  const W = 760, rowH = 52, M = { top: 28, right: 64, bottom: 28, left: 150 };
  const H = M.top + rows.length * rowH + M.bottom;
  const iw = W - M.left - M.right;
  const max = Math.max(...rows.flatMap((r) => [r.onshore25, r.onshore26]));
  const xOf = (v: number) => (v / max) * iw;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label="Continuing (onshore) commencements by level, 2025 vs 2026">
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      {/* legend */}
      <g>
        <rect x={M.left} y={8} width="14" height="9" rx="1" fill={NAVY} fillOpacity="0.3" />
        <text x={M.left + 20} y={16} fontSize="11" fill={NAVY} fillOpacity="0.7">Feb 2025</text>
        <rect x={M.left + 86} y={8} width="14" height="9" rx="1" fill={VERM} />
        <text x={M.left + 106} y={16} fontSize="11" fill={NAVY} fillOpacity="0.7">Feb 2026</text>
      </g>
      {rows.map((r, i) => {
        const top = M.top + i * rowH;
        const bh = 15;
        const mult = r.onshore25 > 0 ? (r.onshore26 / r.onshore25) : 0;
        return (
          <g key={r.level}>
            <text x={M.left - 10} y={top + rowH / 2} textAnchor="end" fontSize="12" fill={NAVY} fillOpacity="0.85">
              {r.level}
            </text>
            <rect x={M.left} y={top + 6} width={xOf(r.onshore25)} height={bh} rx="2" fill={NAVY} fillOpacity="0.3" />
            <text x={M.left + xOf(r.onshore25) + 5} y={top + 6 + bh - 3} fontSize="10" fill={NAVY} fillOpacity="0.6">
              {intFmt.format(r.onshore25)}
            </text>
            <rect x={M.left} y={top + 6 + bh + 3} width={xOf(r.onshore26)} height={bh} rx="2" fill={VERM} />
            <text x={M.left + xOf(r.onshore26) + 5} y={top + 6 + bh + 3 + bh - 3} fontSize="10"
              fontWeight="700" fill={VERM}>
              {intFmt.format(r.onshore26)}{mult >= 1.3 ? `  (${mult.toFixed(mult >= 10 ? 0 : 1)}×)` : ""}
            </text>
          </g>
        );
      })}
      <text x={W - M.right} y={H - 6} textAnchor="end" fontSize="9" fill={NAVY} fillOpacity="0.5">
        magincia.ai · new_to_australia = No (already onshore)
      </text>
    </svg>
  );
}

// ---- Chart 3: visa grants (flat) vs research commencements -----------------
function VisaCrossCheckChart() {
  const W = 760, H = 300, M = { top: 24, right: 24, bottom: 44, left: 56 };
  const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
  const max = 1466;
  const n = RESEARCH_VISAS.length;
  const band = iw / n;
  const barW = Math.min(band * 0.5, 46);
  const yOf = (v: number) => M.top + ih - (v / max) * ih;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label="SA postgraduate research student visa grants versus 2026 research commencements">
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      {[0, 0.5, 1].map((f, i) => (
        <g key={i}>
          <line x1={M.left} x2={W - M.right} y1={yOf(max * f)} y2={yOf(max * f)} stroke={NAVY} strokeOpacity="0.08" />
          <text x={M.left - 8} y={yOf(max * f) + 4} textAnchor="end" fontSize="11" fill={NAVY} fillOpacity="0.6">
            {intFmt.format(Math.round(max * f))}
          </text>
        </g>
      ))}
      {/* reference line: 2026 research commencements */}
      <line x1={M.left} x2={W - M.right} y1={yOf(1466)} y2={yOf(1466)} stroke={VERM} strokeWidth="2" strokeDasharray="5 4" />
      <text x={M.left + 4} y={yOf(1466) - 6} fontSize="11" fontWeight="700" fill={VERM}>
        1,466 — Feb 2026 research commencements
      </text>
      {RESEARCH_VISAS.map((d, i) => {
        const cx = M.left + (i + 0.5) * band;
        const y = yOf(d.v);
        return (
          <g key={d.fy}>
            <rect x={cx - barW / 2} y={y} width={barW} height={M.top + ih - y} fill={BLUE} fillOpacity="0.8" rx="2" />
            <text x={cx} y={y - 5} textAnchor="middle" fontSize="10" fill={NAVY} fillOpacity="0.7">{d.v}</text>
            <text x={cx} y={M.top + ih + 18} textAnchor="middle" fontSize="10" fill={NAVY} fillOpacity="0.6">{d.fy}</text>
          </g>
        );
      })}
      <text transform={`translate(16, ${M.top + ih / 2}) rotate(-90)`} textAnchor="middle"
        fontSize="11" fontWeight="600" fill={NAVY} fillOpacity="0.6">Student visa grants</text>
      <text x={W - M.right} y={H - 6} textAnchor="end" fontSize="9" fill={NAVY} fillOpacity="0.5">
        magincia.ai · Source: Dept of Home Affairs
      </text>
    </svg>
  );
}

// ---- Chart 4: by-state onshore commencement change (the artifact is SA) ----
function ByStateChart() {
  const rows = BY_STATE_ONSHORE.map((r) => ({ ...r, d: r.b - r.a }))
    .sort((x, y) => y.d - x.d);
  const W = 760, rowH = 38, M = { top: 16, right: 60, bottom: 24, left: 56 };
  const H = M.top + rows.length * rowH + M.bottom;
  const iw = W - M.left - M.right;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.d)));
  const zero = M.left + (iw * (0 - -maxAbs)) / (maxAbs - -maxAbs);
  const xOf = (v: number) => M.left + (iw * (v - -maxAbs)) / (maxAbs - -maxAbs);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label="Change in continuing higher-education commencements by state, 2025 to 2026">
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
      <line x1={zero} x2={zero} y1={M.top} y2={M.top + rows.length * rowH} stroke={NAVY} strokeOpacity="0.25" />
      {rows.map((r, i) => {
        const top = M.top + i * rowH;
        const pos = r.d >= 0;
        const x0 = pos ? zero : xOf(r.d);
        const w = Math.abs(xOf(r.d) - zero);
        const isSA = r.state === "SA";
        return (
          <g key={r.state}>
            <text x={M.left - 44} y={top + rowH / 2 + 4} fontSize="12" fontWeight={isSA ? 700 : 400}
              fill={isSA ? VERM : NAVY} fillOpacity={isSA ? 1 : 0.7}>{r.state}</text>
            <rect x={x0} y={top + 8} width={w} height={rowH - 16} rx="2"
              fill={isSA ? VERM : pos ? BLUE : NAVY} fillOpacity={isSA ? 1 : pos ? 0.55 : 0.3} />
            <text x={pos ? xOf(r.d) + 6 : xOf(r.d) - 6} y={top + rowH / 2 + 4}
              textAnchor={pos ? "start" : "end"} fontSize="11" fontWeight={isSA ? 700 : 400}
              fill={isSA ? VERM : NAVY} fillOpacity={isSA ? 1 : 0.7}>
              {pos ? "+" : ""}{intFmt.format(r.d)}
            </text>
          </g>
        );
      })}
      <text x={W - M.right} y={H - 4} textAnchor="end" fontSize="9" fill={NAVY} fillOpacity="0.5">
        magincia.ai · continuing (onshore) commencements, Feb YTD
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

export default function SaCommencementAnomalyPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-navy px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        Case Study · February 2026
      </span>

      <h1 className="mt-6 max-w-3xl text-3xl sm:text-5xl font-semibold tracking-tight text-navy">
        The South Australian commencement anomaly
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-navy/80 leading-snug">
        International <strong>Higher Degree by Research</strong> commencements in South Australia jumped roughly
        tenfold in February 2026 — from 143 to 1,466. On the surface it looks like an extraordinary recruitment
        win. It is the opposite: a statistical artifact of the Adelaide University merger, recorded at the very
        moment genuine new-student arrivals were falling.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value="+925%" label="SA international research commencements, Feb 2025 → Feb 2026" accent={VERM} />
        <Stat value="90%" label="of the surge are students already in Australia (not new arrivals)" />
        <Stat value="12.5×" label="Doctoral commencements alone (108 → 1,349)" accent={VERM} />
        <Stat value="2.1×" label="Research enrolments also doubled (1,424 → 3,021) — the same students counted twice" accent={VERM} />
        <Stat value="117×" label="'Mixed Field Programmes' enrolments (12 → 1,403) — where the new merger CoEs sit" />
        <Stat value="~840" label="SA research student visas granted in the latest year — essentially flat" accent={BLUE} />
      </div>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">The anomaly</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Adelaide University — the merger of the University of Adelaide and the University of South Australia —
        began operating on 1 January 2026. A <em>commencement</em> in the Department of Education&rsquo;s data is
        triggered whenever a student starts or changes a programme. Migrating every continuing student into a new
        Adelaide University programme code is, mechanically, a programme change. South Australia&rsquo;s research
        cohort shows it most violently, because doctoral candidatures run for years, so a large stock of continuing
        candidates was re-commenced all at once.
      </p>

      <ChartCard
        title="SA international research commencements, February YTD"
        sub="Doctoral + Masters by Research. The 2026 bar is the merger artifact, not organic growth.">
        <YearSpikeChart data={RESEARCH_BY_YEAR} yLabel="Commencements (Feb YTD)"
          ariaLabel="South Australian international research commencements by year" />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        What the official methodology says
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        The Department does not flag the merger anywhere in the release, but its own counting rules predict exactly
        this outcome. From the{" "}
        <a className="text-vermillion hover:underline"
          href="https://www.education.gov.au/international-education-data-and-research/explanatory-notes-data-relating-international-students-studying-australia">
          explanatory notes
        </a>{" "}
        and the{" "}
        <a className="text-vermillion hover:underline"
          href="https://www.education.gov.au/international-education-data-and-research/international-student-monthly-summary-and-data-tables">
          monthly data-tables page
        </a>:
      </p>
      <blockquote className="mt-4 max-w-3xl rounded-xl border-l-4 border-vermillion/60 bg-white/60 p-4 text-navy/80">
        <p className="text-sm leading-relaxed">
          &ldquo;A commencement is an enrolment that commenced at any time within the year it appears in.&rdquo;
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          &ldquo;Enrolment numbers is a count of a student&rsquo;s enrolment within the reference period. If a
          student does multiple courses during the reference period, the enrolments will each be counted.&rdquo;
        </p>
      </blockquote>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        The data is built from Confirmations of Enrolment (CoEs) in PRISMS, not from people. Transferring ~56,000
        continuing students to a new CRICOS provider on 1 January issued each of them a <em>new CoE</em>: a new CoE
        starting in 2026 is, by definition, a commencement — and because the legacy CoE was also active at the start
        of the year, <em>both</em> enrolments fall inside the year-to-date window and are each counted.
      </p>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">It isn&rsquo;t new students</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Splitting commencements by whether the student was already in Australia is decisive. Of the 1,466 research
        commencements in February 2026, <strong>1,323 (90%) were students already onshore</strong> — continuing
        candidates, not arrivals. New research arrivals stayed flat (70 → 143). Continuing students don&rsquo;t need
        a fresh visa, which is exactly why the visa data can&rsquo;t — and doesn&rsquo;t — support the rise.
      </p>

      <ChartCard
        title="Continuing (already-onshore) commencements by level — Feb 2025 vs Feb 2026"
        sub="The merger re-commenced continuing students at every level, not just research.">
        <ContinuingByLevelChart />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        It pervades every level — but hides in the totals
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Here is the subtle part. The re-commencement of continuing students happened across <em>every</em> level —
        onshore commencements rose +133% for coursework masters and +39% for bachelors, not just in research. Yet
        the <em>headline totals</em> for those levels barely moved (Masters Coursework +4%, Bachelor −3%). The
        reason: for the large coursework levels, the surge in continuing re-commencements lands at the same time as
        a genuine ~45–50% collapse in <em>new</em> international arrivals, and the two roughly cancel. Doctoral is
        the only level where the artifact breaks the surface, because its continuing stock dwarfs a normal
        year&rsquo;s ~110 commencements.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy/15 text-left text-navy/60">
              <th className="py-2 pr-3 font-semibold">Level of study</th>
              <th className="py-2 px-3 text-right font-semibold">Continuing 25→26</th>
              <th className="py-2 px-3 text-right font-semibold">New arrivals 25→26</th>
              <th className="py-2 pl-3 text-right font-semibold">Total 25→26</th>
            </tr>
          </thead>
          <tbody>
            {BY_LEVEL.map((r) => {
              const tot25 = r.onshore25 + r.new25, tot26 = r.onshore26 + r.new26;
              return (
                <tr key={r.level} className="border-b border-navy/5">
                  <td className="py-2 pr-3 text-navy/85">{r.level}</td>
                  <td className="py-2 px-3 text-right tabular-nums" style={{ color: VERM }}>
                    {intFmt.format(r.onshore25)} → {intFmt.format(r.onshore26)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums" style={{ color: BLUE }}>
                    {intFmt.format(r.new25)} → {intFmt.format(r.new26)}
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums text-navy/85">
                    {intFmt.format(tot25)} → {intFmt.format(tot26)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-3xl text-xs text-navy/55">
        Continuing = already in Australia (new_to_australia = No); new arrivals = new_to_australia = Yes.
        South Australia, Higher Education, February year-to-date. Counts under 5 are perturbed per the
        de-identification rule.
      </p>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        The enrolments doubled too — the same students, counted twice
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        A fair objection to the programme-change explanation: if the surge were just continuing students being
        re-badged, the <em>enrolment</em> count should be stable. It is not. SA research enrolments jumped from{" "}
        <strong>1,424 to 3,021</strong> (doctoral alone: 1,312 → 2,713) — a clean doubling. That is not a second
        mystery; it is the second face of the same artifact. Under the counting rule above, a transferred student
        carries <em>two</em> enrolments through the early-2026 window — the legacy one and the new Adelaide
        University one — and &ldquo;the enrolments will each be counted.&rdquo;
      </p>

      <ChartCard
        title="SA international research enrolments, February YTD"
        sub="The 2026 figure counts most of the continuing cohort twice. The real cohort is ~1,500–1,700.">
        <YearSpikeChart data={RESEARCH_ENR_BY_YEAR} yLabel="Enrolments (Feb YTD)"
          ariaLabel="South Australian international research enrolments by year" />
      </ChartCard>

      <p className="mt-6 max-w-3xl text-navy/80 leading-relaxed">
        The field-of-education split is decisive. The new Adelaide University CoEs were registered under a generic{" "}
        <strong>&ldquo;Mixed Field Programmes&rdquo;</strong> classification — and that single label absorbs the
        entire increase, exploding from 12 to 1,403, while every genuine discipline is flat. The legacy enrolments
        (real fields, ~1,600) plus the new ones (mixed field, ~1,400) are the same cohort listed twice.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy/15 text-left text-navy/60">
              <th className="py-2 pr-3 font-semibold">Broad field of education</th>
              <th className="py-2 px-3 text-right font-semibold">Feb 2025</th>
              <th className="py-2 px-3 text-right font-semibold">Feb 2026</th>
              <th className="py-2 pl-3 text-right font-semibold">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {ENR_BY_FIELD.map((r) => {
              const isMixed = r.field === "Mixed Field Programmes";
              return (
                <tr key={r.field} className="border-b border-navy/5">
                  <td className="py-2 pr-3 font-medium" style={{ color: isMixed ? VERM : NAVY }}>
                    {r.field}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-navy/85">{intFmt.format(r.e25)}</td>
                  <td className="py-2 px-3 text-right tabular-nums"
                    style={{ color: isMixed ? VERM : NAVY, fontWeight: isMixed ? 700 : 400 }}>
                    {intFmt.format(r.e26)}
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums"
                    style={{ color: isMixed ? VERM : NAVY, fontWeight: isMixed ? 700 : 400 }}>
                    {isMixed ? "117×" : `${(r.e26 / r.e25).toFixed(2)}×`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-3xl text-xs text-navy/55">
        SA research (Doctoral + Masters by Research) enrolments, February YTD. The new Adelaide University CoEs sit
        in &ldquo;Mixed Field Programmes&rdquo;; legacy CoEs retain their real field.
      </p>

      <p className="mt-6 max-w-3xl text-navy/80 leading-relaxed">
        Two corroborations. First, every major nationality doubled <em>uniformly</em> — China 2.28×, India 2.31×,
        Iran 2.09×, Bangladesh 2.41×, Sri Lanka 2.03×, Vietnam 2.00×. Real demand shifts never replicate the
        existing stock at a constant multiple; duplication does. Second, continuing-student enrolments went
        1,354 → 2,878 (2.13×) while genuinely new arrivals went 70 → 143 — the doubling sits entirely on the
        cohort that was transferred.
      </p>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">The visa cross-check</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        If 1,466 research students had genuinely commenced, South Australia would have needed a comparable surge in
        postgraduate-research student visa grants. There was none. Grants have sat at roughly 450–1,000 a year for a
        decade, and the most recent full year was ~840 — nowhere near the commencement figure. The gap is the
        continuing students, who were already here.
      </p>

      <ChartCard
        title="SA postgraduate-research student visa grants vs the 2026 commencement figure"
        sub="Visa grants are flat; the commencement statistic is not. Grants can't explain the surge.">
        <VisaCrossCheckChart />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">How much does it skew the sector totals?</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        The artifact is one state. Every other state&rsquo;s continuing-commencement count moved normally in 2026;
        South Australia&rsquo;s leapt by ~2,400. That gap <em>is</em> the merger.
      </p>

      <ChartCard
        title="Change in continuing commencements by state — Higher Education, Feb 2025 → 2026"
        sub="South Australia is the entire anomaly. No other state is doing anything unusual.">
        <ByStateChart />
      </ChartCard>

      <p className="mt-6 max-w-3xl text-navy/80 leading-relaxed">
        Taking the abnormal South Australian onshore gain as the artifact (~2,300–2,450 commencements; point
        estimate ~2,400), the effect on the headline sector figures is:
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-vermillion/20 bg-vermillion/5 p-4">
          <div className="text-sm font-semibold uppercase tracking-wide text-vermillion">SA Higher Education</div>
          <p className="mt-2 text-sm text-navy/80 leading-relaxed">
            Reported <strong>5,683</strong> commencements (+35% YoY). Roughly <strong>40%</strong> is the merger.
            Underlying ≈ <strong>3,300</strong> — about <strong>−20% YoY</strong>, in line with the collapse in new
            arrivals.
          </p>
        </div>
        <div className="rounded-xl border border-navy/15 bg-white/70 p-4">
          <div className="text-sm font-semibold uppercase tracking-wide text-navy/70">National Higher Education</div>
          <p className="mt-2 text-sm text-navy/80 leading-relaxed">
            Reported <strong>65,084</strong> commencements (≈ flat, −0.7% YoY). The artifact inflates this by
            <strong> ~3.6%</strong>. Underlying ≈ <strong>62,700</strong> — about <strong>−4.4% YoY</strong>. The
            &ldquo;held steady&rdquo; read is partly a merger illusion.
          </p>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-xs text-navy/55">
        Other sectors (VET, Schools, ELICOS) are unaffected — the merger involves two universities, so the
        distortion is confined to Higher Education. Estimate range ~2,250–2,650; the conservative figure is used.
      </p>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">What the coverage says</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        The press has reported the <em>real-world</em> side of this — and, in one case, the data distortion itself:
      </p>
      <ul className="mt-4 max-w-3xl space-y-3 text-navy/80">
        <li className="rounded-xl border border-navy/10 bg-white/60 p-4">
          <a className="font-semibold text-vermillion hover:underline"
            href="https://www.indailysa.com.au/news/just-in/2026/06/02/exclusive-adelaide-uni-in-red-as-international-student-numbers-plummet">
            InDaily — &ldquo;Adelaide Uni in red as international student numbers plummet&rdquo;
          </a>{" "}
          <span className="text-sm text-navy/60">(2 June 2026)</span>
          <p className="mt-1 text-sm leading-relaxed">
            New international commencements ran ~40% below target with a projected $90m shortfall. The
            Vice-Chancellor noted the university &ldquo;performed well&rdquo; <em>retaining existing</em>
            international students — the problem was recruiting <em>new</em> ones. That retained-vs-new distinction
            is precisely the split that produces the statistical anomaly.
          </p>
        </li>
        <li className="rounded-xl border border-navy/10 bg-white/60 p-4">
          <a className="font-semibold text-vermillion hover:underline"
            href="https://thepienews.com/2026-nosc-allocations-rise-for-australian-public-universities/">
            The PIE News — &ldquo;2026 NOSC allocations rise for Australian public universities&rdquo;
          </a>{" "}
          <span className="text-sm text-navy/60">(14 October 2025)</span>
          <p className="mt-1 text-sm leading-relaxed">
            Nous Group&rsquo;s Nicholas Dillon: the merger &ldquo;accounts for most of the increase in Go8
            NOSC&rdquo; — strip it out and Group-of-Eight allocation growth falls from 9% to 4%, making the rising
            share &ldquo;somewhat misleading.&rdquo; The clearest acknowledgment that merger arithmetic is bending
            the published numbers.
          </p>
        </li>
        <li className="rounded-xl border border-navy/10 bg-white/60 p-4">
          <a className="font-semibold text-vermillion hover:underline"
            href="https://www.indailysa.com.au/news/just-in/2026/01/29/unisa-brand-cant-be-scrubbed-as-premier-officially-opens-merged-uni">
            InDaily — &ldquo;Premier officially opens merged uni&rdquo;
          </a>{" "}
          <span className="text-sm text-navy/60">(29 January 2026)</span>
          <p className="mt-1 text-sm leading-relaxed">
            Confirms the go-live: continuing students of both legacy universities automatically became Adelaide
            University students in 2026 — the event that re-commenced the cohort.
          </p>
        </li>
      </ul>
      <p className="mt-4 max-w-3xl text-navy/80 leading-relaxed">
        What has <em>not</em> been reported is the specific mechanism here: that the official international
        <em> commencement</em> statistic for South Australia surged at the same time, driven entirely by continuing
        students being re-commenced. The media has the &ldquo;new students are crashing&rdquo; story; this case study
        supplies the reconciling other half.
      </p>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">The takeaway</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Any year-on-year read of South Australian international <em>commencements or enrolments</em> across the
        2025→2026 boundary — at <em>any</em> level — is a structural break, not a trend. Commencements are inflated
        because re-issued CoEs count as new starts; enrolments are inflated because the same student carries two
        countable enrolments through the window. To recover the real new-student signal, filter to new arrivals
        (<code className="rounded bg-navy/5 px-1 text-sm">new_to_australia = Yes</code>); on that basis South
        Australia&rsquo;s new international students fell, in line with the national decline and tighter visa
        settings. Research is simply where the distortion is impossible to miss.
      </p>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        <strong>What to watch.</strong> The December 2026 YTD release will still carry the double-count (both
        enrolments were active during 2026). Expect the series to snap back to roughly 1,500–1,700 research
        enrolments at <strong>February 2027</strong>, once only the Adelaide University CoE remains — and for
        &ldquo;Mixed Field Programmes&rdquo; to linger as SA&rsquo;s dominant research field label until the CRICOS
        coding is corrected. The clean arbiter will be the federal <em>student load</em> (EFTSL) release for 2026:
        study load does not double when a student is re-enrolled, so flat overseas EFTSL will confirm the artifact
        beyond argument.
      </p>

      <footer className="mt-12 border-t border-navy/10 pt-6 text-sm text-navy/60">
        <p className="max-w-3xl">
          <strong className="text-navy/70">Method &amp; sources.</strong> Figures are a fixed snapshot from the
          Australian Department of Education &ldquo;February 2026 — Latest Data&rdquo; international-student release
          (Higher Education sector, South Australia, February year-to-date), cross-referenced with Department of
          Home Affairs student-visa grant data. &ldquo;Research&rdquo; = Doctoral Degree + Masters Degree
          (Research). Counting definitions quoted from the Department&rsquo;s{" "}
          <a className="text-vermillion hover:underline"
            href="https://www.education.gov.au/international-education-data-and-research/explanatory-notes-data-relating-international-students-studying-australia">
            explanatory notes for data relating to international students studying in Australia
          </a>. Counts below 5 are perturbed to &ldquo;&lt;5&rdquo; under the de-identification rule; none
          occur at the grain shown. Every figure is traceable to its source file via the magincia lineage layer.
        </p>
        <p className="mt-3 font-semibold text-vermillion">magincia.ai</p>
      </footer>
    </main>
  );
}
