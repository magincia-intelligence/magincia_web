import type { MetadataRoute } from "next";
import { getAllBriefs, getBriefsByMonth } from "@/lib/briefs";

const SITE = "https://magincia.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const briefs = getAllBriefs();
  const months = getBriefsByMonth();
  const latest = briefs[0]?.date;
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      url: `${SITE}/`,
      lastModified: latest ?? today,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE}/archive`,
      lastModified: latest ?? today,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${SITE}/search`,
      lastModified: latest ?? today,
      changeFrequency: "daily",
      priority: 0.4,
    },
    {
      url: `${SITE}/intelligence`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...months.map((m) => ({
      url: `${SITE}/archive/${m.month}`,
      lastModified: m.briefs[0]?.date ?? today,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...briefs.map((b) => ({
      url: `${SITE}/briefs/${b.date}`,
      lastModified: b.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
