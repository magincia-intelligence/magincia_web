import type { Metadata } from "next";
import SubscribeForm from "../components/SubscribeForm";

export const metadata: Metadata = {
  title: "Market Intelligence — Australian International Education",
  description:
    "Interactive market intelligence and data visualisations for international education in Australia — student flows, visa trends, provider performance, and policy impact. Coming soon.",
  alternates: { canonical: "/intelligence" },
};

const PLANNED = [
  "Student visa grants, refusals, and processing trends over time",
  "National Planning Level (NPL) allocations by provider and sector",
  "Source-country mix and emerging markets",
  "ELICOS, VET, and higher education enrolment flows",
  "Policy and regulatory impact tracking",
];

export default function IntelligencePage() {
  return (
    <main className="w-full max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <span className="inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        Coming soon
      </span>

      <h1 className="mt-6 text-3xl sm:text-5xl font-semibold tracking-tight text-navy">
        Market Intelligence
      </h1>
      <p className="mt-4 text-lg text-navy/80 leading-snug">
        Interactive data visualisations for Australian international education —
        turning the signals behind the daily brief into charts, dashboards, and
        trends you can explore.
      </p>

      <div className="mt-10 rounded-xl border border-navy/10 bg-white/60 p-6 sm:p-8">
        <p className="text-navy/75">
          We&rsquo;re building a market intelligence tool to make the data behind
          Australian education visible and explorable. The first release focuses
          on <strong className="text-navy">international education</strong>.
        </p>
        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-navy/50">
          What&rsquo;s coming
        </h2>
        <ul className="mt-3 space-y-2">
          {PLANNED.map((item) => (
            <li key={item} className="flex gap-2 text-navy/75">
              <span aria-hidden className="text-vermillion">
                →
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 flex flex-col items-center text-center">
        <h2 className="text-xl font-semibold text-navy">
          Be the first to know when it launches
        </h2>
        <p className="mt-1 text-sm text-navy/60">
          Subscribers to the Daily Brief will be notified when Market
          Intelligence goes live.
        </p>
        <SubscribeForm />
      </div>
    </main>
  );
}
