import { NextResponse } from "next/server";
import { getKpis } from "@/lib/intelligence";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const data = await getKpis({
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
    console.error("intelligence/kpis error:", err);
    return NextResponse.json({ error: "Failed to load KPIs" }, { status: 500 });
  }
}
