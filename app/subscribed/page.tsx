import Link from "next/link";
import type { Metadata } from "next";
import SubscribeForm from "../components/SubscribeForm";

export const metadata: Metadata = {
  title: "Subscription confirmed",
  description: "Your subscription to the Magincia Intelligence Daily Brief.",
  robots: { index: false },
};

const STATES = {
  success: {
    badge: "Confirmed",
    heading: "You're on the list 🎉",
    body: "Your subscription to the Magincia Intelligence Daily Brief is confirmed. You'll get the next brief in your inbox on the next business day.",
    showForm: false,
  },
  invalid: {
    badge: "Link expired",
    heading: "This confirmation link is invalid or has expired",
    body: "Confirmation links are valid for 48 hours. No problem — just subscribe again below and we'll send a fresh one.",
    showForm: true,
  },
  error: {
    badge: "Something went wrong",
    heading: "We couldn't confirm your subscription",
    body: "Something went wrong on our end. Please try subscribing again in a moment.",
    showForm: true,
  },
} as const;

export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const state =
    status === "invalid"
      ? STATES.invalid
      : status === "error"
        ? STATES.error
        : STATES.success;

  return (
    <main className="w-full max-w-2xl mx-auto px-6 py-20 sm:py-28 text-center">
      <span className="inline-flex items-center rounded-full bg-vermillion px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        {state.badge}
      </span>
      <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-navy">
        {state.heading}
      </h1>
      <p className="mt-4 text-lg text-navy/75 leading-snug">{state.body}</p>

      {state.showForm && <SubscribeForm />}

      <div className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-blue transition-colors hover:text-vermillion"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
