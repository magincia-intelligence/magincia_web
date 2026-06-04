import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BRIEFS_DIR = path.join(process.cwd(), "content", "briefs");

export interface BriefMeta {
  date: string; // ISO YYYY-MM-DD
  weekday: string; // e.g. "Thursday"
  time: string; // e.g. "09:34 AEST"
  title: string;
  summary: string; // 1-2 sentence lead, shown on the homepage
}

export interface Brief {
  meta: BriefMeta;
  body: string;
}

function readBrief(date: string): Brief | null {
  const file = path.join(BRIEFS_DIR, `${date}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    meta: {
      date: String(data.date ?? date),
      weekday: String(data.weekday ?? ""),
      time: String(data.time ?? ""),
      title: String(data.title ?? "Daily Brief — Australian Education"),
      summary: String(data.summary ?? ""),
    },
    body: content.trim(),
  };
}

export function getAllBriefs(): BriefMeta[] {
  if (!fs.existsSync(BRIEFS_DIR)) return [];
  return fs
    .readdirSync(BRIEFS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readBrief(f.replace(/\.md$/, "")))
    .filter((b): b is Brief => b !== null)
    .map((b) => b.meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getBrief(date: string): Brief | null {
  return readBrief(date);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
