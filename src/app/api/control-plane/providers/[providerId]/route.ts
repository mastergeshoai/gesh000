import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { disableProvider } from "@/lib/control-plane/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const admin = await requireAdmin();
    const body = z.object({ status: z.literal("disabled") }).safeParse(await request.json().catch(() => null));
    if (!body.success) return NextResponse.json({ error: "Only disabling is supported" }, { status: 400 });
    const { providerId } = await params;
    const provider = await disableProvider(admin.id, providerId);
    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    return NextResponse.json({ provider });
  } catch (error) {
    if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to update provider" }, { status: 500 });
  }
}
