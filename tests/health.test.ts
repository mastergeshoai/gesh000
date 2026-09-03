import { describe, expect, it } from "vitest";
import { inspectBrowserRuntime } from "@/lib/runtime-health";

describe("runtime health", () => {
  it("returns a safe shape without secrets", async () => {
    const health = await inspectBrowserRuntime();
    expect(health).toHaveProperty("ok");
    expect(health).toHaveProperty("browser");
    expect(health).toHaveProperty("libraries");
    expect(JSON.stringify(health)).not.toMatch(/api[-_]?key|password|secret/i);
  });
});
