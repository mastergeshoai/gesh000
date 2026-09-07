import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin";
import { availableProviderAdapters, createProvider, listProviders } from "@/lib/control-plane/service";
import type { ProviderDescriptor } from "@/lib/control-plane/types";

async function userId() {
  try {
    const admin = await requireAdmin();
    return admin.id;
  } catch {
    return null;
  }
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ providers: await listProviders(id), available: availableProviderAdapters() });
}

export async function POST(request: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Partial<ProviderDescriptor>;
  if (!body.slug || !body.name || !body.adapterKey || !Array.isArray(body.capabilities)) {
    return NextResponse.json({ error: "Invalid provider definition" }, { status: 400 });
  }
  try {
    const provider = await createProvider(id, body as ProviderDescriptor);
    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNSUPPORTED_PROVIDER") return NextResponse.json({ error: "Unsupported provider" }, { status: 422 });
    return NextResponse.json({ error: "Unable to create provider" }, { status: 500 });
  }
}
