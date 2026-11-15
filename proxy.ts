import { NextResponse, type NextRequest } from "next/server";

// Temporary site lock: everything except the daily-brief side of the site asks
// for a password (HTTP Basic auth, any username). Public paths are an explicit
// allowlist, so any new page is protected by default. Remove this file (or
// empty PROTECT) to open the site again.
//
// Password: Vercel env var SITE_PASSWORD. If it is unset the protected pages
// stay locked (fail closed) rather than opening up.
const PUBLIC_PREFIXES = [
  "/briefs",
  "/archive",
  "/search",
  "/subscribed",
  "/api/subscribe", // sign-up + email confirmation links must keep working
];
const PUBLIC_EXACT = new Set(["/", "/robots.txt", "/sitemap.xml", "/favicon.ico"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(req: NextRequest) {
  if (isPublic(req.nextUrl.pathname)) return NextResponse.next();

  const password = process.env.SITE_PASSWORD;
  const header = req.headers.get("authorization") ?? "";
  if (password && header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(supplied, password)) return NextResponse.next();
    } catch {
      // malformed header — fall through to the challenge
    }
  }

  return new NextResponse("This part of magincia.ai is private for now.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Magincia Intelligence", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  // Skip Next internals and static files (anything with a file extension).
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
