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

export function formatMonthLabel(month: string): string {
  // month is "YYYY-MM"
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export interface BriefMonth {
  month: string; // "YYYY-MM"
  label: string; // "June 2026"
  briefs: BriefMeta[]; // newest-first within the month
}

export function getBriefsByMonth(): BriefMonth[] {
  const byMonth = new Map<string, BriefMeta[]>();
  for (const b of getAllBriefs()) {
    const month = b.date.slice(0, 7); // "YYYY-MM"
    const list = byMonth.get(month);
    if (list) list.push(b);
    else byMonth.set(month, [b]);
  }
  return [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0])) // newest month first
    .map(([month, briefs]) => ({
      month,
      label: formatMonthLabel(month),
      briefs,
    }));
}

// ---- Story tagging ----------------------------------------------------------
// Tags are derived from each story's text by keyword rules — no manual or
// pipeline-authored tags. A story can match multiple tags. Filtering is OR:
// a story is shown if it matches any selected tag. Order below is the canonical
// display order for filter chips.
export const STORY_TAG_ORDER = [
  "International Education",
  "Higher Education",
  "Early Childhood",
  "Secondary Education",
  "ELICOS",
  "Study Abroad",
  "Policy",
] as const;

export type StoryTag = (typeof STORY_TAG_ORDER)[number];

const TAG_RULES: { tag: StoryTag; re: RegExp }[] = [
  {
    tag: "International Education",
    re: /\binternational (student|education)|overseas student|\bCRICOS\b|\bvisa\b|\bNPL\b|\bESOS\b|net overseas migration|\bNOM\b|refusal rate|offshore|study in australia/i,
  },
  {
    tag: "Higher Education",
    re: /\buniversit(y|ies)|higher education|\bTEQSA\b|\bATEC\b|vice-chancellor|\bHELP\b|\bHECS\b|job-ready graduate|\baccord\b|tertiary|managed growth|needs-based funding|\bVET\b|\bTAFE\b|\bASQA\b|commencement|undergraduate|postgraduate/i,
  },
  {
    tag: "Early Childhood",
    re: /early childhood|early learning|\bECEC\b|child ?care|preschool|kindergarten|national quality standard|child safety|early educator/i,
  },
  {
    tag: "Secondary Education",
    re: /secondary|high school|public school|school funding|\bNAPLAN\b|year 1[0-2]|senior secondary|phonics|numeracy assessment|catch-up tutoring|schools? agreement/i,
  },
  {
    tag: "ELICOS",
    re: /\bELICOS\b|english language (college|course|intensive)/i,
  },
  {
    tag: "Study Abroad",
    re: /study abroad|new colombo|outbound mobility|student exchange|exchange program/i,
  },
  {
    tag: "Policy",
    re: /legislation|\bbill\b|parliament|question time|consultation|\bregulation\b|\breform\b|\bpolicy\b|funding agreement|\blevy\b|undertaking|compliance|\bminister\b/i,
  },
];

export function classifyStory(text: string): StoryTag[] {
  return TAG_RULES.filter((r) => r.re.test(text)).map((r) => r.tag);
}

export interface BriefBlock {
  md: string; // markdown for one story (bullet marker stripped)
  tags: StoryTag[];
}

export interface BriefSection {
  heading: string | null;
  blocks: BriefBlock[];
}

// Parse a brief body into sections (## headings) → story blocks, each tagged.
// A "story" is a top-level bullet or a standalone paragraph within a section.
export function parseBrief(body: string): BriefSection[] {
  const lines = body.split("\n");
  const sections: BriefSection[] = [];
  let current: BriefSection = { heading: null, blocks: [] };
  let buf: string[] = [];
  let bufIsItem = false;

  const flush = () => {
    if (buf.length) {
      let md = buf.join("\n").trim();
      if (bufIsItem) md = md.replace(/^\s*-\s+/, "");
      if (md) current.blocks.push({ md, tags: classifyStory(md) });
    }
    buf = [];
    bufIsItem = false;
  };

  const pushSection = () => {
    if (current.heading !== null || current.blocks.length) sections.push(current);
  };

  for (const line of lines) {
    const h = line.match(/^##\s+(.*)/);
    if (h) {
      flush();
      pushSection();
      current = { heading: h[1].trim(), blocks: [] };
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      flush();
      buf = [line];
      bufIsItem = true;
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    buf.push(line); // continuation or paragraph line
  }
  flush();
  pushSection();
  return sections;
}

export function briefTags(sections: BriefSection[]): StoryTag[] {
  const present = new Set<string>();
  for (const s of sections) for (const b of s.blocks) for (const t of b.tags) present.add(t);
  return STORY_TAG_ORDER.filter((t) => present.has(t));
}
