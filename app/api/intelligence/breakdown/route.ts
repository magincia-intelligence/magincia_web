import { NextResponse } from "next/server";
import { getBreakdown } from "@/lib/intelligence";

export const runtime = "nodejs";
export const revalidate = 3600;

const DIMENSIONS = new Set(["nationality", "state", "sector", "region"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dimension = searchParams.get("dimension") ?? "nationality";
  const measure = searchParams.get("measure") === "commencements" ? "commencements" : "enrolments";
  if (!DIMENSIONS.has(dimension)) {
    return NextResponse.json({ error: "invalid dimension" }, { status: 400 });
  }
  try {
    const data = await getBreakdown(dimension, measure, {
      sector: searchParams.get("sector"),
      region: searchParams.get("region"),
      nationality: searchParams.get("nationality"),
      state: searchParams.get("state"),
      providerType: searchParams.get("providerType"),
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("intelligence/breakdown error:", err);
    return NextResponse.json({ error: "Failed to load breakdown" }, { status: 500 });
  }
}
