import { NextResponse } from "next/server";
import { inspectBrowserRuntime } from "@/lib/runtime-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await inspectBrowserRuntime();
  return NextResponse.json(health, { status: health.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
