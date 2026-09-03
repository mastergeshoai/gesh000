import { describe, expect, it, vi } from "vitest";
import { pollUntil, PollTimeoutError } from "@/lib/polling";

describe("pollUntil", () => {
  it("retries with backoff until a result is available", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const promise = pollUntil(async () => ++calls >= 3 ? "ready" : null, { intervalMs: 10, maxIntervalMs: 20 });
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(15);
    await expect(promise).resolves.toBe("ready");
    vi.useRealTimers();
  });

  it("aborts when the caller aborts", async () => {
    const controller = new AbortController();
    const promise = pollUntil(async () => null, { intervalMs: 5, signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toBeDefined();
  });

  it("exposes a typed timeout error", () => {
    expect(new PollTimeoutError()).toBeInstanceOf(Error);
  });
});
