import type { ProviderDescriptor } from "./types";

export interface ProviderAdapter {
  readonly key: string;
  readonly provider: ProviderDescriptor;
  test(input: { endpoint?: string }): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

const adapters = new Map<string, ProviderAdapter>();

export function registerProvider(adapter: ProviderAdapter) {
  adapters.set(adapter.key, adapter);
}

export function getProviderAdapter(key: string) {
  return adapters.get(key);
}

export function listProviderAdapters() {
  return Array.from(adapters.values()).map(({ provider }) => provider);
}

const vcaasProvider: ProviderDescriptor = {
  slug: "vcaas",
  name: "Totalum VCaaS",
  adapterKey: "vcaaS",
  capabilities: { chat: true, files: true, sandbox: true },
};

registerProvider({
  key: "vcaas",
  provider: vcaasProvider,
  async test() {
    const started = Date.now();
    try {
      const response = await fetch("https://api-accounts.totalum.app/api/v1/vcaas/health", {
        method: "GET",
        signal: AbortSignal.timeout(10_000),
      });
      return { ok: response.ok, latencyMs: Date.now() - started, ...(response.ok ? {} : { error: `HTTP_${response.status}` }) };
    } catch {
      return { ok: false, latencyMs: Date.now() - started, error: "PROVIDER_UNAVAILABLE" };
    }
  },
});
