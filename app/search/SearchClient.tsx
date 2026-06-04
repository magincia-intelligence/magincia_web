"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatLongDate } from "@/lib/format";
import type { StoryRecord, StoryTag } from "@/lib/briefs";

const mdComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

function TagChip({
  tag,
  active,
  onClick,
}: {
  tag: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-vermillion text-cream"
          : "bg-navy/5 text-navy/70 hover:bg-navy/10 hover:text-navy"
      }`}
    >
      {tag}
    </button>
  );
}

export default function SearchClient({
  stories,
  tags,
}: {
  stories: StoryRecord[];
  tags: StoryTag[];
}) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [active, setActive] = useState<string[]>([]);

  const toggle = (t: string) =>
    setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return stories.filter((s) => {
      // OR across tags
      if (active.length && !s.tags.some((t) => active.includes(t))) return false;
      // AND across query terms, matched against story text + dateline + section
      if (terms.length) {
        const hay = `${s.text} ${s.weekday} ${s.date} ${s.heading ?? ""}`.toLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [stories, query, active]);

  const hasFilter = query.trim().length > 0 || active.length > 0;

  return (
    <div>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Search all briefs…"
          aria-label="Search all briefs"
          className="w-full rounded-lg border border-navy/15 bg-white px-4 py-3 text-navy placeholder:text-navy/40 focus:border-vermillion focus:outline-none focus:ring-2 focus:ring-vermillion/30"
        />
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-navy/50">
            Filter
          </span>
          {tags.map((t) => (
            <TagChip
              key={t}
              tag={t}
              active={active.includes(t)}
              onClick={() => toggle(t)}
            />
          ))}
          {active.length > 0 && (
            <button
              type="button"
              onClick={() => setActive([])}
              className="ml-1 text-xs font-medium text-blue hover:text-vermillion"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <p className="mt-6 text-sm text-navy/60">
        {hasFilter
          ? `${results.length} ${results.length === 1 ? "story" : "stories"}`
          : `${stories.length} stories across all briefs`}
      </p>

      <ul className="mt-4 border-t border-navy/10">
        {results.map((s, i) => (
          <li key={`${s.date}-${i}`} className="border-b border-navy/10 py-5">
            <div className="flex items-baseline justify-between gap-4">
              <Link
                href={`/briefs/${s.date}`}
                className="text-sm font-semibold text-blue transition-colors hover:text-vermillion"
              >
                {[s.weekday, formatLongDate(s.date)].filter(Boolean).join(", ")}
              </Link>
              {s.heading && (
                <span className="shrink-0 text-xs uppercase tracking-wide text-navy/40">
                  {s.heading}
                </span>
              )}
            </div>
            <div className="prose prose-lg max-w-none prose-p:my-0 mt-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {s.md}
              </ReactMarkdown>
            </div>
            {s.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <TagChip
                    key={t}
                    tag={t}
                    active={active.includes(t)}
                    onClick={() => toggle(t)}
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {hasFilter && results.length === 0 && (
        <p className="mt-8 text-navy/60">No stories match your search.</p>
      )}
    </div>
  );
}
