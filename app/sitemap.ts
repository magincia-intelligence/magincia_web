import type { MetadataRoute } from "next";
import { getAllBriefs } from "@/lib/briefs";

const SITE = "https://magincia.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const briefs = getAllBriefs();
  const latest = briefs[0]?.date;
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      url: `${SITE}/`,
      lastModified: latest ?? today,
      changeFrequency: "daily",
      priority: 1,
    },
    ...briefs.map((b) => ({
      url: `${SITE}/briefs/${b.date}`,
      lastModified: b.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
