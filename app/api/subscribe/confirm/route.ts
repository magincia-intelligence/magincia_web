import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyToken } from "@/lib/subscribe-token";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const token = url.searchParams.get("token") ?? "";

  const redirect = (status?: string) =>
    NextResponse.redirect(
      `${origin}/subscribed${status ? `?status=${status}` : ""}`,
      303,
    );

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const secret = process.env.SUBSCRIBE_SECRET;
  if (!apiKey || !audienceId || !secret) {
    console.error("Confirm: env not configured");
    return redirect("error");
  }

  const verified = verifyToken(token, secret);
  if (!verified) return redirect("invalid");

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.contacts.create({
      audienceId,
      email: verified.email,
      unsubscribed: false,
    });
    if (error) {
      const msg = String(error.message ?? "").toLowerCase();
      // Already a contact → treat as confirmed (idempotent).
      if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
        return redirect();
      }
      console.error("Confirm: Resend contacts.create error", error);
      return redirect("error");
    }
    return redirect();
  } catch (err) {
    console.error("Confirm: unexpected error", err);
    return redirect("error");
  }
}
