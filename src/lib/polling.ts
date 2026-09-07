export type PollOptions = {
  signal?: AbortSignal;
  intervalMs?: number;
  maxIntervalMs?: number;
  timeoutMs?: number;
  backoff?: number;
};

export class PollTimeoutError extends Error {
  constructor(message = "Polling timed out") {
    super(message);
    this.name = "PollTimeoutError";
  }
}

export async function pollUntil<T>(
  check: (signal: AbortSignal) => Promise<T | null>,
  options: PollOptions = {},
): Promise<T> {
  const intervalMs = options.intervalMs ?? 1000;
  const maxIntervalMs = options.maxIntervalMs ?? 10000;
  const backoff = options.backoff ?? 1.5;
  const timeoutMs = options.timeoutMs ?? 120000;
  const controller = new AbortController();
  const signal = controller.signal;
  const onAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(new PollTimeoutError()), timeoutMs);
  let delay = intervalMs;
  try {
    while (!signal.aborted) {
      const result = await check(signal);
      if (result !== null) return result;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
        }, { once: true });
      });
      delay = Math.min(maxIntervalMs, Math.ceil(delay * backoff));
    }
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }
}
