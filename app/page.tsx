import Image from "next/image";
import Link from "next/link";
import { formatLongDate, getAllBriefs } from "@/lib/briefs";
import SubscribeForm from "./components/SubscribeForm";

export default function Home() {
  const briefs = getAllBriefs();

  return (
    <div className="flex flex-col items-center w-full bg-cream">
      <section className="w-full flex justify-center px-6 pt-12 sm:pt-16">
        <Image
          src="/magincia_banner.png"
          alt="Magincia Intelligence — Education Market Intelligence | Insight. Clarity. Advantage."
          width={1983}
          height={793}
          priority
          className="w-full max-w-5xl h-auto"
        />
      </section>

      <section className="w-full flex flex-col items-center px-6 pt-6 text-center">
        <p className="max-w-2xl text-lg sm:text-xl text-navy/80">
          AI-powered market intelligence for the Australian education sector
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
          Beta
        </span>
        <SubscribeForm />
      </section>

      <section className="w-full max-w-3xl px-6 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold text-navy">
          Daily Briefs
        </h2>
        <p className="mt-1 text-sm text-navy/60">
          Australian education — published each business day.
        </p>

        {briefs.length === 0 ? (
          <p className="mt-8 text-navy/60">No briefs published yet.</p>
        ) : (
          <ul className="mt-6 border-t border-navy/10">
            {briefs.map((b) => (
              <li key={b.date} className="border-b border-navy/10">
                <Link
                  href={`/briefs/${b.date}`}
                  className="group block py-5"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-semibold text-navy transition-colors group-hover:text-vermillion">
                      {[b.weekday, formatLongDate(b.date)]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    <span className="shrink-0 text-sm text-navy/50">
                      {b.time}
                    </span>
                  </div>
                  {b.summary && (
                    <p className="mt-2 text-navy/75 leading-snug">
                      {b.summary}
                    </p>
                  )}
                  <span className="mt-2 inline-block text-sm font-medium text-blue transition-colors group-hover:text-vermillion">
                    Read more →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
