import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { disableProvider } from "@/lib/control-plane/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (body.status !== "disabled") return NextResponse.json({ error: "Only disabling is supported" }, { status: 400 });
  const { providerId } = await params;
  const provider = await disableProvider(session.user.id, providerId);
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  return NextResponse.json({ provider });
}
