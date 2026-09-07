import { describe, expect, it } from "vitest";
import { getProviderAdapter, listProviderAdapters } from "@/lib/control-plane/registry";

describe("provider registry", () => {
  it("exposes only registered adapters", () => {
    expect(listProviderAdapters().map((provider) => provider.slug)).toEqual(["vcaas"]);
    expect(getProviderAdapter("not-registered")).toBeUndefined();
  });

  it("resolves every advertised adapter key", () => {
    for (const provider of listProviderAdapters()) {
      expect(getProviderAdapter(provider.adapterKey)?.provider).toEqual(provider);
    }
  });

  it("does not expose credentials in provider definitions", () => {
    const provider = listProviderAdapters()[0];
    expect(provider).not.toHaveProperty("apiKey");
    expect(provider).not.toHaveProperty("token");
    expect(provider).not.toHaveProperty("secret");
  });
});
