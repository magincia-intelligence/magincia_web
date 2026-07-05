import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Australia's international student boom has turned — May 2026 data",
  description:
    "The Department of Education's May 2026 release is the first year-on-year decline of the post-pandemic era: international enrolments fell 7.6% and commencements 8.0%. The contraction is concentrated in VET and ELICOS and in the pathway source markets, while Higher Education's apparent resilience is likely affected by a comparability break from the Adelaide University merger.",
  alternates: { canonical: "/intelligence/international-education-may-2026" },
};

// Static analysis of the Australian Dept of Education "May 2026 — All Data"
// international-student release (3,583,979 pivot-cache records, loaded to the
// magincia warehouse 5 Jul 2026). Every figure below is a verified query against
// the gold marts. Year-to-date measures compare the same month across years.
export const revalidate = false;

const NAVY = "#102238";
const VERM = "#EA401C";
const BLUE = "#1E487A";
const intFmt = new Intl.NumberFormat("en-AU");
const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

// ---- Data (verified against gold.* marts, May year-to-date) ----------------
// National YTD enrolments, May, by year.
const ENR_BY_YEAR = [
  { y: 2021, v: 591251 }, { y: 2022, v: 521818 }, { y: 2023, v: 677355 },
  { y: 2024, v: 806578 }, { y: 2025, v: 814676 }, { y: 2026, v: 752784 },
];
// National YTD commencements (new starts — the leading indicator), May, by year.
const COM_BY_YEAR = [
  { y: 2021, v: 158288 }, { y: 2022, v: 168178 }, { y: 2023, v: 263485 },
  { y: 2024, v: 283379 }, { y: 2025, v: 235637 }, { y: 2026, v: 216884 },
];
// Sector enrolments May 2026 with YoY vs May 2025.
const SECTORS = [
  { s: "Higher Education", e: 452364, yoy: 2.3 },
  { s: "VET", e: 219994, yoy: -19.7 },
  { s: "ELICOS", e: 44775, yoy: -27.1 },
  { s: "Non-award", e: 19750, yoy: -1.5 },
  { s: "Schools", e: 15901, yoy: -7.6 },
];
// Top source markets, enrolments May 2026, share of national, YoY vs May 2025.
const MARKETS = [
  { c: "China", e: 170943, share: 22.7, yoy: -5.7 },
  { c: "India", e: 126841, share: 16.9, yoy: -9.8 },
  { c: "Nepal", e: 67448, share: 9.0, yoy: 3.1 },
  { c: "Vietnam", e: 33560, share: 4.5, yoy: -9.0 },
  { c: "Bangladesh", e: 31480, share: 4.2, yoy: 41.8 },
  { c: "Philippines", e: 24564, share: 3.3, yoy: -36.3 },
  { c: "Indonesia", e: 24158, share: 3.2, yoy: 1.2 },
  { c: "Colombia", e: 22073, share: 2.9, yoy: -27.8 },
  { c: "Pakistan", e: 21178, share: 2.8, yoy: -12.8 },
  { c: "Sri Lanka", e: 19281, share: 2.6, yoy: -5.0 },
  { c: "Brazil", e: 18280, share: 2.4, yoy: -17.3 },
  { c: "Thailand", e: 16816, share: 2.2, yoy: -25.2 },
];
// Enrolments by state, May 2026, YoY vs May 2025.
const STATES = [
  { s: "NSW", e: 288565, yoy: -7.5 }, { s: "VIC", e: 229565, yoy: -7.8 },
  { s: "QLD", e: 102786, yoy: -8.7 }, { s: "WA", e: 65111, yoy: -5.1 },
  { s: "SA", e: 40152, yoy: -9.4 }, { s: "ACT", e: 14762, yoy: -12.0 },
  { s: "TAS", e: 7080, yoy: 1.1 }, { s: "NT", e: 4763, yoy: 9.5 },
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
        magincia.ai · Source: Dept of Education · May year-to-date
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

// ---- Chart: source markets — enrolment size bar + YoY label ----------------
function MarketBars() {
  const rows = MARKETS;
  const W = 760, rowH = 34, M = { top: 16, right: 116, bottom: 26, left: 96 };
  const H = M.top + rows.length * rowH + M.bottom;
  const iw = W - M.left - M.right;
  const max = Math.max(...rows.map((r) => r.e));
  const xOf = (v: number) => (v / max) * iw;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" role="img"
      aria-label="Top international student source markets, enrolments and year-on-year change">
      <rect x="0" y="0" width={W} height={H} fill="#ffffff" />
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
            <text x={W - 8} y={top + rowH / 2 + 4} textAnchor="end" fontSize="11" fontWeight="700"
              fill={grew ? BLUE : VERM}>
              {pct(r.yoy)}
            </text>
          </g>
        );
      })}
      <text x={M.left} y={H - 4} textAnchor="start" fontSize="9" fill={NAVY} fillOpacity="0.5">
        Bar = enrolments (May 2026 YTD) · right = YoY vs May 2025
      </text>
      <text x={W - M.right} y={H - 4} textAnchor="end" fontSize="9" fill={NAVY} fillOpacity="0.5">
        magincia.ai
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

export default function MayReleaseAnalysisPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
      <Link href="/intelligence" className="text-sm text-blue transition-colors hover:text-vermillion">
        ← Intelligence
      </Link>

      <span className="mt-6 inline-flex items-center rounded-full bg-navy px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        Release Analysis · May 2026
      </span>

      <h1 className="mt-6 max-w-3xl text-3xl sm:text-5xl font-semibold tracking-tight text-navy">
        The boom has turned
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-navy/80 leading-snug">
        The Department of Education&rsquo;s May 2026 release is the first year-on-year contraction of the
        post-pandemic era. International <strong>enrolments</strong> fell to 752,784 &mdash; down 7.6% on a year
        earlier &mdash; and new <strong>commencements</strong> fell 8.0%. The decline is not broad-based: it is
        concentrated in the VET and ELICOS pathway sectors and in the source markets that feed them, while Higher
        Education&rsquo;s apparent resilience is likely affected by a comparability break from the Adelaide
        University merger.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value="752,784" label="International enrolments, May 2026 YTD" />
        <Stat value="−7.6%" label="Enrolments year-on-year — first decline since the recovery" accent={VERM} />
        <Stat value="216,884" label="Commencements (new starts), May 2026 YTD" />
        <Stat value="−8.0%" label="Commencements year-on-year" accent={VERM} />
      </div>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">A peak, then a turn</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Enrolments compound: each year&rsquo;s stock carries forward multi-year degree students, so the total is
        slow to move. It rose every year through the post-COVID recovery &mdash; from a 2022 trough of 521,818 to a
        May 2025 peak of 814,676. May 2026 breaks that run. The 61,892-student fall is the first decline since the
        borders reopened, and it lands even though the standing stock of continuing students should cushion it.
      </p>

      <ChartCard
        title="National international enrolments, May year-to-date"
        sub="Blue marks the 2025 peak; red is the first post-recovery decline.">
        <YearBars data={ENR_BY_YEAR} peakYear={2025} yLabel="Enrolments (May YTD)"
          ariaLabel="National international student enrolments by year, May year-to-date" />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        Commencements turned a year earlier
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Commencements &mdash; students <em>starting</em> a course &mdash; are the leading indicator: they are new
        business, and they respond to policy within a single intake. They peaked at 283,379 in May 2024 and have
        fallen for two straight years, to 216,884 &mdash; now <strong>23% below the 2024 peak</strong>. The
        enrolment stock is only now catching up to a downturn that commencements signalled in 2025. Because
        commencements lead, the direction of travel for 2027 enrolments is already set.
      </p>

      <ChartCard
        title="National commencements, May year-to-date"
        sub="The leading indicator peaked in 2024 and has fallen two years running.">
        <YearBars data={COM_BY_YEAR} peakYear={2024} yLabel="Commencements (May YTD)"
          ariaLabel="National international student commencements by year, May year-to-date" />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        The decline is a VET and ELICOS story
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Split by sector, the contraction is sharply uneven. <strong>ELICOS</strong> (English-language courses)
        fell 27% and <strong>VET</strong> (vocational) fell 20% &mdash; these are the shorter, cheaper, pathway
        products most exposed to the 2024&ndash;25 visa-integrity settings: the higher financial-capacity
        requirement, the Genuine Student test, and the enrolment caps under Ministerial Direction 111. Higher
        Education, by contrast, reads <span style={{ color: BLUE }} className="font-semibold">+2.3%</span> &mdash;
        but that number should be treated with care (see below).
      </p>

      <ChartCard
        title="Enrolment change by sector — May 2025 → May 2026"
        sub="Pathway sectors (ELICOS, VET) are carrying the entire decline.">
        <DivergingBars
          rows={SECTORS.map((s) => ({ label: s.s, yoy: s.yoy, sub: `${intFmt.format(s.e)} enrolments` }))}
          ariaLabel="Year-on-year enrolment change by sector, May 2026"
          note="magincia.ai · YoY % of May-YTD enrolments" />
      </ChartCard>

      <div className="mt-6 max-w-3xl rounded-xl border-l-4 border-vermillion/60 bg-white/60 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-vermillion">Read Higher Education with care</p>
        <p className="mt-2 text-sm text-navy/80 leading-relaxed">
          Higher Education is the <em>only</em> sector showing growth, yet every state&rsquo;s total enrolments
          fell 5&ndash;12%. The likely explanation is a comparability break from the Adelaide University merger:
          on 1 January 2026 the two legacy universities&rsquo; continuing students moved onto a single new
          provider, which affects how the 2025 and 2026 figures line up. We are confirming the exact treatment
          with the Department before drawing firm conclusions. On a like-for-like basis, Higher Education looks
          closer to flat than to growth &mdash; more in step with the other sectors. We look at the merger&rsquo;s
          effect on the year-on-year comparison in more detail in the{" "}
          <Link href="/intelligence/sa-commencement-anomaly" className="font-semibold text-vermillion hover:underline">
            South Australian commencement anomaly
          </Link>{" "}
          case study. For now, the sector&rsquo;s small reported gain is best read with caution.
        </p>
      </div>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        Where the students come from
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        The two anchor markets held up relatively well &mdash; China (170,943, −5.7%) and India (126,841, −9.8%)
        together still supply four in ten international students. The damage sits in the mid-tier pathway markets:
        the <strong>Philippines fell 36%</strong>, Colombia 28%, Thailand 25% and Brazil 17% &mdash; exactly the
        ELICOS- and VET-heavy source countries. Two markets buck the trend hard: <strong>Bangladesh surged 42%</strong>
        {" "}and Nepal, now the third-largest source at 67,448, edged up 3%.
      </p>

      <ChartCard
        title="Top 12 source markets — enrolments and year-on-year change"
        sub="Bars sized by May 2026 enrolments; the pathway markets are falling fastest.">
        <MarketBars />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">
        A broad-based geographic decline
      </h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Every major destination is down. The big three markets move together &mdash; NSW −7.5%, Victoria −7.8%,
        Queensland −8.7% &mdash; and the ACT, dominated by two universities, fell hardest at −12.0%. Only the two
        smallest jurisdictions grew: the Northern Territory (+9.5%) and Tasmania (+1.1%), each off a low base and
        each a beneficiary of the regional-study incentives that steer students away from the major cities.
      </p>

      <ChartCard
        title="Enrolment change by state — May 2025 → May 2026"
        sub="The contraction is national; only NT and TAS, off small bases, grew.">
        <DivergingBars
          rows={STATES.map((s) => ({ label: s.s, yoy: s.yoy, sub: `${intFmt.format(s.e)} enrolments` }))}
          ariaLabel="Year-on-year enrolment change by state, May 2026"
          note="magincia.ai · YoY % of May-YTD enrolments" />
      </ChartCard>

      <h2 className="mt-12 max-w-3xl text-2xl font-semibold tracking-tight text-navy">The takeaway</h2>
      <p className="mt-3 max-w-3xl text-navy/80 leading-relaxed">
        Australia&rsquo;s international education boom, which added a quarter of a million enrolments between 2022
        and 2025, has rolled over. The turn is policy-driven and targeted: the visa-integrity settings of 2024&ndash;25
        were aimed at the pathway end of the market, and that is precisely where the numbers are falling &mdash; ELICOS,
        VET, and the mid-tier source countries that feed them. Higher Education looks insulated, but that likely
        reflects a comparability break from the Adelaide University merger rather than genuine strength; on a
        like-for-like basis the picture is softer. And because commencements &mdash;
        the leading indicator &mdash; are down for a second year and sit 23% below their 2024 peak, the 2026 enrolment
        decline is the beginning of the adjustment, not the end of it.
      </p>

      <footer className="mt-12 border-t border-navy/10 pt-6 text-sm text-navy/60">
        <p className="max-w-3xl">
          <strong className="text-navy/70">Method &amp; sources.</strong> Figures are drawn from the Australian
          Department of Education &ldquo;May 2026 &mdash; All Data&rdquo; international-student release
          (3,583,979 records), loaded to the magincia warehouse on 5 July 2026 and modelled through its silver and
          gold layers. All measures are <em>year-to-date to May</em> and compare the same month across years, per
          the Department&rsquo;s{" "}
          <a className="text-vermillion hover:underline"
            href="https://www.education.gov.au/international-education-data-and-research/explanatory-notes-data-relating-international-students-studying-australia">
            explanatory notes
          </a>. Source listing:{" "}
          <a className="text-vermillion hover:underline"
            href="https://www.education.gov.au/international-education-data-and-research/international-student-monthly-summary-and-data-tables">
            international student monthly summary and data tables
          </a>. Counts below 5 are perturbed under the de-identification rule; none occur at the grain shown. Every
          figure is traceable to its source file via the magincia lineage layer.
        </p>
        <p className="mt-3 font-semibold text-vermillion">magincia.ai</p>
      </footer>
    </main>
  );
}
