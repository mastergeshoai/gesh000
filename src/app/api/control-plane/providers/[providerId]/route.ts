import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { disableProvider } from "@/lib/control-plane/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (body.status !== "disabled") return NextResponse.json({ error: "Only disabling is supported" }, { status: 400 });
  const { providerId } = await params;
  const provider = await disableProvider(admin.id, providerId);
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  return NextResponse.json({ provider });
}
