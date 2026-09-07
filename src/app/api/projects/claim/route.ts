import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
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
  const claimed = await db.insert(projectAccess).values({ id: crypto.randomUUID(), userId: session.user.id, projectId: body.projectId }).onConflictDoNothing().returning({ id: projectAccess.id });
  if (claimed.length) return NextResponse.json({ ok: true });
  /**
   * The unique constraint is on `projectId` alone, so an empty insert means
   * "someone already owns this" — but that someone is usually the caller
   * themself: a retried create-after-partial-failure claims the same project
   * twice. Claiming is "ensure I own this", so an existing row for THIS user
   * is success, not conflict; only a different owner is a real 409.
   */
  const existing = await db
    .select({ id: projectAccess.id })
    .from(projectAccess)
    .where(and(eq(projectAccess.userId, session.user.id), eq(projectAccess.projectId, body.projectId)));
  if (existing.length) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, error: "Project is unavailable" }, { status: 409 });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
