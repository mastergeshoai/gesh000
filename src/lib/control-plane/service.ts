import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { getProviderAdapter, listProviderAdapters } from "./registry";
import type { ProviderDescriptor } from "./types";

export async function listProviders(userId: string) {
  const rows = await db.select().from(providers).where(and(eq(providers.userId, userId), isNull(providers.deletedAt)));
  return rows.map((row) => ({ ...row, capabilities: row.capabilities as ProviderDescriptor["capabilities"] }));
}

export async function createProvider(userId: string, input: ProviderDescriptor) {
  const adapter = getProviderAdapter(input.adapterKey);
  if (!adapter || adapter.provider.slug !== input.slug) throw new Error("UNSUPPORTED_PROVIDER");
  const [provider] = await db.insert(providers).values({
    id: crypto.randomUUID(), userId, slug: adapter.provider.slug, name: adapter.provider.name, adapterKey: adapter.key,
    status: "disabled", capabilities: adapter.provider.capabilities,
  }).returning();
  return provider;
}

export async function disableProvider(userId: string, providerId: string) {
  const [provider] = await db.update(providers).set({ status: "disabled", updatedAt: new Date() })
    .where(and(eq(providers.id, providerId), eq(providers.userId, userId), isNull(providers.deletedAt))).returning();
  return provider ?? null;
}

export function availableProviderAdapters() {
  return listProviderAdapters();
}
