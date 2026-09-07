import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { availableProviderAdapters, latestProviderHealth, listProviderCredentials, listProviders } from "@/lib/control-plane/service";
import { ProvidersManager } from "@/components/providers-manager";
import type { CredentialView, HealthView } from "@/components/control-plane/provider-card";

export default async function ProvidersPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError && error.status === 401) redirect("/sign-in");
    if (!(error instanceof AdminAccessError)) throw error;
    return (
      <section className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-16">
        <h1 className="text-balance text-2xl font-semibold">ليس لديك صلاحية الوصول</h1>
        <p className="text-muted-foreground">إدارة المزودين متاحة للمدير العام فقط.</p>
        <Link href="/projects" className="text-primary underline underline-offset-4">العودة إلى المشاريع</Link>
      </section>
    );
  }
  const providers = await listProviders(admin.id);
  /**
   * Per-provider credentials (masked) and the latest health probe, fetched in
   * parallel — a handful of providers makes the fan-out cheaper than a join and
   * keeps the service functions single-purpose.
   */
  const [credentialLists, healthRows] = await Promise.all([
    Promise.all(providers.map((provider) => listProviderCredentials(admin.id, provider.id))),
    Promise.all(providers.map((provider) => latestProviderHealth(admin.id, provider.id))),
  ]);
  const credentials: Record<string, CredentialView[]> = {};
  const health: Record<string, HealthView> = {};
  providers.forEach((provider, index) => {
    credentials[provider.id] = credentialLists[index].map((row) => ({
      id: row.id,
      label: row.label,
      masked: row.masked,
      status: row.status,
      lastRotatedAt: row.lastRotatedAt ? row.lastRotatedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    }));
    const row = healthRows[index];
    health[provider.id] = row ? { state: row.state, latencyMs: row.latencyMs, checkedAt: row.checkedAt.toISOString() } : null;
  });
  return <ProvidersManager catalog={{ providers, available: availableProviderAdapters(), credentials, health }} />;
}
