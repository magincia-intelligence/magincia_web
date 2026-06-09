import { NextResponse } from "next/server";
import { getSeries } from "@/lib/intelligence";

export const runtime = "nodejs";
// Cache responses for an hour: the underlying data only changes ~monthly.
export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const series = await getSeries({
      sector: searchParams.get("sector"),
      region: searchParams.get("region"),
      nationality: searchParams.get("nationality"),
      state: searchParams.get("state"),
      providerType: searchParams.get("providerType"),
    });
    return NextResponse.json(
      { series },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.error("intelligence/series error:", err);
    return NextResponse.json({ error: "Failed to load series" }, { status: 500 });
  }
}
