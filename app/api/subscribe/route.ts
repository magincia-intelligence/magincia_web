import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeBody = {
  email?: string;
  // Honeypot field — bots fill this; humans never see it.
  website?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(req: Request) {
  let body: SubscribeBody = {};
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return badRequest("Invalid request body.");
  }

  // Honeypot: a real user never fills this. Silent success so bots don't learn.
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ ok: true, status: "subscribed" });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return badRequest("Please enter your email address.");
  if (email.length > 254) return badRequest("That email is too long.");
  if (!EMAIL_RE.test(email)) return badRequest("That doesn't look like a valid email address.");

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.error("Subscribe: RESEND_API_KEY or RESEND_AUDIENCE_ID not set");
    return NextResponse.json(
      { ok: false, error: "Subscription service isn't configured yet. Please try again later." },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    });

    if (error) {
      const msg = String(error.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
        return NextResponse.json({ ok: true, status: "already_subscribed" });
      }
      console.error("Subscribe: Resend error", error);
      return NextResponse.json(
        { ok: false, error: "We couldn't add you right now. Please try again in a moment." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, status: "subscribed", id: data?.id ?? null });
  } catch (err) {
    console.error("Subscribe: unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't add you right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
