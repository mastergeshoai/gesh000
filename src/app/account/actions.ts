"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("غير مصرح");
  return session.user;
}

export async function updateProfile(input: { name: string; language: string; timezone: string }) {
  const current = await currentUser();
  const name = input.name.trim();
  if (name.length < 2 || name.length > 80) throw new Error("الاسم يجب أن يكون بين حرفين و80 حرفًا");
  if (!['ar', 'en'].includes(input.language)) throw new Error("اللغة غير صالحة");
  if (!input.timezone || input.timezone.length > 80) throw new Error("المنطقة الزمنية غير صالحة");
  await db.update(user).set({ name, language: input.language, timezone: input.timezone, updatedAt: new Date() }).where(eq(user.id, current.id));
  revalidatePath("/account");
  return { name, language: input.language, timezone: input.timezone };
}

export async function revokeOtherSessions() {
  const current = await currentUser();
  await auth.api.revokeOtherSessions({ headers: await headers() });
  return current.id;
}
