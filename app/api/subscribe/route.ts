import { NextResponse } from "next/server";
import { Resend } from "resend";
import { signToken } from "@/lib/subscribe-token";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Cap confirmation-email sends per IP so the endpoint can't be used to spam
// arbitrary inboxes (or run up the Resend bill). 5 per 10 minutes is generous
// for a real subscriber, hostile to abuse.
const RATE_LIMIT = 5;
const RATE_WINDOW_SEC = 600;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM = "Magincia Intelligence <daily@magincia.ai>";
const REPLY_TO = "prompt@magincia.ai";

type SubscribeBody = {
  email?: string;
  // Honeypot field — bots fill this; humans never see it.
  website?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function confirmEmail(confirmUrl: string) {
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5EAD7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#102238;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5EAD7;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="padding:8px 8px 24px;">
<h1 style="margin:0 0 16px;font-size:22px;color:#102238;">Confirm your subscription</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#102238;">You're one click away from the <strong>Magincia Intelligence Daily Brief</strong> — Australian domestic and international education, every business day.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#102238;">Tap the button to confirm you'd like to receive it:</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background:#D9542B;">
<a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:600;color:#F5EAD7;text-decoration:none;">Confirm subscription →</a>
</td></tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#102238;opacity:0.6;">If the button doesn't work, paste this link into your browser:<br><a href="${confirmUrl}" style="color:#1E487A;">${confirmUrl}</a></p>
<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#102238;opacity:0.6;">This link expires in 48 hours. If you didn't request this, just ignore this email — you won't be subscribed.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `Confirm your subscription to the Magincia Intelligence Daily Brief.

Click to confirm: ${confirmUrl}

This link expires in 48 hours. If you didn't request this, ignore this email — you won't be subscribed.`;
  return { html, text };
}

export async function POST(req: Request) {
  const { ok, retryAfterSec } = rateLimit(
    `subscribe:${clientIp(req)}`,
    RATE_LIMIT,
    RATE_WINDOW_SEC,
  );
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again in a little while." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let body: SubscribeBody = {};
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return badRequest("Invalid request body.");
  }

  // Honeypot: a real user never fills this. Silent success so bots don't learn.
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ ok: true, status: "pending" });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return badRequest("Please enter your email address.");
  if (email.length > 254) return badRequest("That email is too long.");
  if (!EMAIL_RE.test(email)) return badRequest("That doesn't look like a valid email address.");

  const apiKey = process.env.RESEND_API_KEY;
  const secret = process.env.SUBSCRIBE_SECRET;
  if (!apiKey || !secret) {
    console.error("Subscribe: RESEND_API_KEY or SUBSCRIBE_SECRET not set");
    return NextResponse.json(
      { ok: false, error: "Subscription service isn't configured yet. Please try again later." },
      { status: 503 },
    );
  }

  // Build the confirmation link against this deployment's own origin so it
  // works on production and preview deployments alike.
  const origin = new URL(req.url).origin;
  const token = signToken(email, secret);
  const confirmUrl = `${origin}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
  const { html, text } = confirmEmail(confirmUrl);

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject: "Confirm your subscription to the Magincia Daily Brief",
      html,
      text,
    });
    if (error) {
      console.error("Subscribe: Resend send error", error);
      return NextResponse.json(
        { ok: false, error: "We couldn't send the confirmation email. Please try again in a moment." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (err) {
    console.error("Subscribe: unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't send the confirmation email. Please try again in a moment." },
      { status: 502 },
    );
  }
}
