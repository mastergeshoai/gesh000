import { NextResponse } from "next/server";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { latestProviderHealth, runProviderHealthCheck } from "@/lib/control-plane/service";

function failure(error: unknown) {
  if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.message === "PROVIDER_NOT_FOUND") return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  if (error instanceof Error && error.message === "UNSUPPORTED_PROVIDER") return NextResponse.json({ error: "Unsupported provider" }, { status: 422 });
  return NextResponse.json({ error: "Unable to check provider health" }, { status: 500 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { providerId } = await params;
    return NextResponse.json({ health: await latestProviderHealth(admin.id, providerId) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { providerId } = await params;
    return NextResponse.json({ health: await runProviderHealthCheck(admin.id, providerId) });
  } catch (error) {
    return failure(error);
  }
}
