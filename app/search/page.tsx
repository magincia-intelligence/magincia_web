import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllStories, storyTags } from "@/lib/briefs";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search — Australian Education Daily Briefs",
  description:
    "Search every Magincia Intelligence daily brief on Australian education and international education in Australia by keyword and topic.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  const stories = getAllStories();
  const tags = storyTags(stories);

  return (
    <main className="w-full max-w-3xl mx-auto px-6 sm:px-8 lg:px-10 py-16">
      <Link
        href="/"
        className="text-sm text-blue hover:text-vermillion transition-colors"
      >
        ← Home
      </Link>

      <header className="mt-6 mb-8 border-b border-navy/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold text-navy">Search</h1>
        <p className="mt-2 text-navy/70">
          Search every story across all daily briefs by keyword and topic.
        </p>
      </header>

      <Suspense fallback={null}>
        <SearchClient stories={stories} tags={tags} />
      </Suspense>
    </main>
  );
}
