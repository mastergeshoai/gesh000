import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerCredentials, providerHealth, providers } from "@/lib/db/schema";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/secret-crypto";
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

// ─────────────────────────── Provider credentials ───────────────────────────

/**
 * Masked previews only. The ciphertext is decrypted server-side to build the
 * mask (the same pattern as the account Totalum key) and never crosses the
 * wire in either direction.
 */
export async function listProviderCredentials(userId: string, providerId: string) {
  const rows = await db.select().from(providerCredentials)
    .where(and(eq(providerCredentials.userId, userId), eq(providerCredentials.providerId, providerId)))
    .orderBy(desc(providerCredentials.createdAt));
  return rows.map(({ ciphertext, ...row }) => ({ ...row, masked: maskSecret(decryptSecret(ciphertext)) }));
}

export async function addProviderCredential(userId: string, providerId: string, label: string, secret: string) {
  const [provider] = await db.select({ id: providers.id }).from(providers)
    .where(and(eq(providers.id, providerId), eq(providers.userId, userId), isNull(providers.deletedAt))).limit(1);
  if (!provider) throw new Error("PROVIDER_NOT_FOUND");
  try {
    const [credential] = await db.insert(providerCredentials).values({
      id: crypto.randomUUID(), userId, providerId, label,
      ciphertext: encryptSecret(secret), keyVersion: "v1", status: "active",
    }).returning({ id: providerCredentials.id, label: providerCredentials.label, status: providerCredentials.status, createdAt: providerCredentials.createdAt });
    return credential;
  } catch (error) {
    // The unique key is (userId, providerId, label) and includes revoked rows,
    // so a re-used label — even of a revoked key — is a conflict, not a crash.
    if (error instanceof Error && error.message.includes("unique")) throw new Error("LABEL_TAKEN");
    throw error;
  }
}

export async function rotateProviderCredential(userId: string, credentialId: string, secret: string) {
  const [credential] = await db.update(providerCredentials)
    .set({ ciphertext: encryptSecret(secret), keyVersion: "v1", lastRotatedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(providerCredentials.id, credentialId), eq(providerCredentials.userId, userId)))
    .returning({ id: providerCredentials.id });
  return credential ?? null;
}

export async function revokeProviderCredential(userId: string, credentialId: string) {
  const [credential] = await db.update(providerCredentials)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(providerCredentials.id, credentialId),
      eq(providerCredentials.userId, userId),
      eq(providerCredentials.status, "active"),
    ))
    .returning({ id: providerCredentials.id });
  return credential ?? null;
}

// ──────────────────────────── Provider health ────────────────────────────────

export async function latestProviderHealth(userId: string, providerId: string) {
  const [row] = await db.select().from(providerHealth)
    .where(and(
      eq(providerHealth.userId, userId),
      eq(providerHealth.providerId, providerId),
      isNull(providerHealth.connectionId),
    ))
    .orderBy(desc(providerHealth.checkedAt)).limit(1);
  return row ?? null;
}

/**
 * Runs the adapter's probe and records the result. The provider's own status
 * follows the probe — unless the admin disabled it, in which case their
 * choice wins over any probe result.
 */
export async function runProviderHealthCheck(userId: string, providerId: string) {
  const [provider] = await db.select().from(providers)
    .where(and(eq(providers.id, providerId), eq(providers.userId, userId), isNull(providers.deletedAt))).limit(1);
  if (!provider) throw new Error("PROVIDER_NOT_FOUND");
  const adapter = provider.adapterKey ? getProviderAdapter(provider.adapterKey) : null;
  if (!adapter) throw new Error("UNSUPPORTED_PROVIDER");

  const result = await adapter.test({ endpoint: provider.endpoint ?? undefined });
  const [check] = await db.insert(providerHealth).values({
    id: crypto.randomUUID(), userId, providerId, connectionId: null,
    state: result.ok ? "healthy" : "unhealthy",
    latencyMs: result.latencyMs,
    details: result.ok ? {} : { error: result.error ?? "UNKNOWN" },
  }).returning();

  if (provider.status !== "disabled") {
    await db.update(providers)
      .set({ status: result.ok ? "active" : "degraded", updatedAt: new Date() })
      .where(eq(providers.id, providerId));
  }
  return check;
}
