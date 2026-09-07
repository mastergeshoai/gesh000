import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { addProviderCredential, listProviderCredentials } from "@/lib/control-plane/service";

const addInput = z.object({
  label: z.string().trim().min(1).max(60),
  secret: z.string().min(8).max(512),
});

function failure(error: unknown) {
  if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.message === "PROVIDER_NOT_FOUND") return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  if (error instanceof Error && error.message === "LABEL_TAKEN") return NextResponse.json({ error: "A credential with that label already exists" }, { status: 409 });
  return NextResponse.json({ error: "Unable to manage credentials" }, { status: 500 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { providerId } = await params;
    return NextResponse.json({ credentials: await listProviderCredentials(admin.id, providerId) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const admin = await requireAdmin();
    const parsed = addInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid credential payload" }, { status: 400 });
    const { providerId } = await params;
    const credential = await addProviderCredential(admin.id, providerId, parsed.data.label, parsed.data.secret);
    return NextResponse.json({ credential }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
