import { describe, expect, it } from "vitest";
import { isProviderStatus, isRoutingStrategy, vcaaSFixture } from "@/lib/control-plane/types";

describe("control plane foundation", () => {
  it("ships only a real VCaaS fixture", () => {
    expect(vcaaSFixture.provider.adapterKey).toBe("vcaaS");
    expect(vcaaSFixture.models).toEqual([]);
  });

  it("validates provider and routing states", () => {
    expect(isProviderStatus("active")).toBe(true);
    expect(isProviderStatus("fake-provider")).toBe(false);
    expect(isRoutingStrategy("priority")).toBe(true);
    expect(isRoutingStrategy("round-robin")).toBe(false);
  });
});
