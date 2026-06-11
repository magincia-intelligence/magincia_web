import type { FieldDemand } from "@/lib/domestic-meta";
import InfoTip from "./InfoTip";

const OFFER_RATE_NOTE =
  "The % beside each field is its offer rate — offers ÷ applications. It is " +
  "typically high (~85–90%) because most applicants get an offer for some course " +
  "somewhere; it reflects demand-side conversion, not ATAR selectivity. It varies " +
  "more by field: Health is lowest, reflecting capped, competitive entry " +
  "(medicine, nursing). Source: Dept of Education, Undergraduate Applications & Offers.";

const NAVY = "#102238";
const BLUE = "#1E487A";
const VERM = "#EA401C";

const W = 760;
const LABEL_W = 196;
const BAR_X = 206;
const BAR_W = 392;
const VAL_X = 612;
const ROW_H = 30;
const TOP = 44;
const BAR_H = 16;

export default function FieldDemandPanel({ data }: { data: FieldDemand }) {
  const max = Math.max(...data.rows.map((r) => r.applications), 1);
  const H = TOP + data.rows.length * ROW_H + 12;
  const wOf = (v: number) => (v / max) * BAR_W;

  return (
    <figure className="rounded-2xl border border-navy/10 bg-white/60 p-5">
      <figcaption className="text-sm font-semibold text-navy">
        Undergraduate applications by field of education — national · {data.year}
        <InfoTip label="offer rate" text={OFFER_RATE_NOTE} />
      </figcaption>
      <p className="mt-1 text-xs text-navy/55">
        Bar length = applications; filled portion = offers. National only — the
        source does not publish applications by field for individual states.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block w-full" role="img"
        aria-label={`National undergraduate applications and offers by field of education, ${data.year}`}>
        {/* legend */}
        <g>
          <rect x={BAR_X} y={16} width={26} height={11} rx="2" fill={BLUE} fillOpacity="0.18" />
          <rect x={BAR_X} y={16} width={16} height={11} rx="2" fill={VERM} fillOpacity="0.9" />
          <text x={BAR_X + 34} y={25} fontSize="11" fill={NAVY} fillOpacity="0.6">
            Applications (bar) · offers (filled) · % = offer rate
          </text>
        </g>
        {data.rows.map((r, i) => {
          const y = TOP + i * ROW_H;
          const appsW = wOf(r.applications);
          const offW = wOf(r.offers);
          return (
            <g key={r.field}>
              <text x={LABEL_W} y={y + BAR_H - 2} textAnchor="end" fontSize="11.5"
                fill={NAVY} fillOpacity="0.82">
                {r.field.length > 30 ? r.field.slice(0, 29) + "…" : r.field}
              </text>
              <rect x={BAR_X} y={y} width={appsW} height={BAR_H} rx="2.5"
                fill={BLUE} fillOpacity="0.18" />
              <rect x={BAR_X} y={y} width={offW} height={BAR_H} rx="2.5"
                fill={VERM} fillOpacity="0.88" />
              <text x={VAL_X} y={y + BAR_H - 2} fontSize="11.5" fill={NAVY} fillOpacity="0.85">
                {r.applications.toLocaleString()}
                <tspan fill={NAVY} fillOpacity="0.5">{`  ·  ${Math.round(r.offerRate * 100)}%`}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
