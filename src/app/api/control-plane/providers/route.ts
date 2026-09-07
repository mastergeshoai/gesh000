import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { availableProviderAdapters, createProvider, listProviders } from "@/lib/control-plane/service";

const providerInput = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  adapterKey: z.string().min(1).max(80),
  capabilities: z.record(z.string().min(1).max(80), z.boolean()),
});

function failure(error: unknown) {
  if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.message === "UNSUPPORTED_PROVIDER") return NextResponse.json({ error: "Unsupported provider" }, { status: 422 });
  return NextResponse.json({ error: "Unable to access provider registry" }, { status: 500 });
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    return NextResponse.json({ providers: await listProviders(admin.id), available: availableProviderAdapters() });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = providerInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid provider definition" }, { status: 400 });
    const provider = await createProvider(admin.id, parsed.data);
    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
