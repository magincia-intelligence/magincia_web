"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BriefSection, StoryTag } from "@/lib/briefs";

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

export default function BriefBody({
  sections,
  tags,
}: {
  sections: BriefSection[];
  tags: StoryTag[];
}) {
  const [active, setActive] = useState<string[]>([]);

  const toggle = (t: string) =>
    setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  // OR semantics: with no filter active, show everything.
  const visible = (blockTags: string[]) =>
    active.length === 0 || blockTags.some((t) => active.includes(t));

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-10 border-b border-navy/10 pb-6">
          <div className="flex flex-wrap items-center gap-2">
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
        </div>
      )}

      {sections.map((section, i) => {
        const blocks = section.blocks.filter((b) => visible(b.tags));
        if (blocks.length === 0) return null;
        return (
          <section key={i} className="mb-10">
            {section.heading && (
              <h2 className="mb-4 text-xl font-semibold text-navy">
                {section.heading}
              </h2>
            )}
            <ul className="border-t border-navy/10">
              {blocks.map((b, j) => (
                <li key={j} className="border-b border-navy/10 py-5">
                  <div className="prose prose-lg max-w-none prose-p:my-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {b.md}
                    </ReactMarkdown>
                  </div>
                  {b.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.tags.map((t) => (
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
          </section>
        );
      })}
    </div>
  );
}
