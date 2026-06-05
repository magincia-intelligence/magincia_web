import crypto from "node:crypto";

// Stateless double opt-in token: base64url(`email:exp`) + "." + HMAC.
// No DB needed — the signature itself proves the email was issued by us.

const DEFAULT_TTL_SECONDS = 60 * 60 * 48; // 48 hours

export function signToken(
  email: string,
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const data = Buffer.from(`${email}:${exp}`).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(
  token: string,
  secret: string,
): { email: string } | null {
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: string;
  try {
    payload = Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const sep = payload.lastIndexOf(":");
  if (sep < 1) return null;
  const email = payload.slice(0, sep);
  const exp = Number(payload.slice(sep + 1));
  if (!email || !Number.isFinite(exp)) return null;
  if (Math.floor(Date.now() / 1000) > exp) return null;

  return { email };
}
