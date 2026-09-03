import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectAccess } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { projectId?: string } | null;
  if (!body?.projectId || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/.test(body.projectId)) {
    return NextResponse.json({ ok: false, error: "Invalid projectId" }, { status: 400 });
  }
  await db.insert(projectAccess).values({ id: crypto.randomUUID(), userId: session.user.id, projectId: body.projectId }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
