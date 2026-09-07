import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { revokeProviderCredential, rotateProviderCredential } from "@/lib/control-plane/service";

const rotateInput = z.object({ secret: z.string().min(8).max(512) });

function failure(error: unknown) {
  if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  return NextResponse.json({ error: "Unable to update credential" }, { status: 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ credentialId: string }> }) {
  try {
    const admin = await requireAdmin();
    const parsed = rotateInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid rotation payload" }, { status: 400 });
    const { credentialId } = await params;
    const credential = await rotateProviderCredential(admin.id, credentialId, parsed.data.secret);
    if (!credential) return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    return NextResponse.json({ credential });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ credentialId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { credentialId } = await params;
    const credential = await revokeProviderCredential(admin.id, credentialId);
    if (!credential) return NextResponse.json({ error: "Credential not found or already revoked" }, { status: 404 });
    return NextResponse.json({ credential });
  } catch (error) {
    return failure(error);
  }
}
