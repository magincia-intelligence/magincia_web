"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "pending" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const honeypot =
      (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
      };

      if (data.ok) {
        setStatus("pending");
        setMessage(
          "Almost there — check your inbox and click the confirmation link to finish subscribing.",
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const disabled = status === "loading";
  const success = status === "pending";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 w-full max-w-md mx-auto text-left"
      noValidate
    >
      {/* Honeypot — hidden from real users, irresistible to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          disabled={disabled}
          className="flex-1 rounded-md border border-navy/20 bg-white/70 px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-md bg-blue px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-vermillion disabled:opacity-60"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p className="mt-2 text-xs text-navy/60 text-center sm:text-left">
        Get the daily brief in your inbox each business day. Free, no spam.
      </p>
      {message && (
        <p
          className={`mt-2 text-sm text-center sm:text-left ${
            success ? "text-blue" : "text-vermillion"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
