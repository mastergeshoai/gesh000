import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";

export class AdminAccessError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Unauthorized" : "Forbidden");
    this.name = "AdminAccessError";
  }
}

async function hasAdminRole(userId: string) {
  const [record] = await db.select({ role: userRoles.role }).from(userRoles)
    .where(eq(userRoles.userId, userId)).limit(1);
  return record?.role === "admin";
}

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return await hasAdminRole(session.user.id) ? session.user : null;
}

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AdminAccessError(401);
  if (!await hasAdminRole(session.user.id)) throw new AdminAccessError(403);
  return session.user;
}
