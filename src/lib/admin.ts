import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  const [role] = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, session.user.id)).limit(1);
  return role?.role === "admin" ? session.user : null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("ADMIN_REQUIRED");
  return admin;
}
