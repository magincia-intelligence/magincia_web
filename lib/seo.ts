// Shared SEO helpers: safe JSON-LD serialization + structured-data builders.

export const SITE_URL = "https://magincia.ai";
export const SITE_NAME = "Magincia Intelligence";

// JS line terminators that are legal inside JSON strings but break inline
// <script> parsing; built from char codes so no literal separators live here.
const LINE_SEP = new RegExp(
  `[${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`,
  "g",
);

/**
 * Serialize a JSON-LD object for embedding in a <script> tag. JSON.stringify
 * does not escape `<`, so a literal `</script>` in any string field would break
 * out of the tag; U+2028/U+2029 would break inline-script parsing. Escaping
 * both makes the payload safe to inline regardless of content.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEP, (ch) => "\\u" + ch.charCodeAt(0).toString(16));
}

/** BreadcrumbList structured data from an ordered list of {name, path}. */
export function breadcrumbLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
