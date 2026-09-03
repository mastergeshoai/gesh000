"use client";

/**
 * Typed client-side fetch service.
 *
 * All client components MUST use these helpers instead of raw `fetch()`
 * so every call/response follows the same `{ ok, data?, error? }` shape.
 */

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  total?: number;
  error?: any;
}

const REQUEST_TIMEOUT_MS = 30_000;

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: options?.signal ?? controller.signal });
    const json = (await res.json()) as ApiResponse<T>;
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.assign(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
    }
    return { ...json, ok: res.ok && json.ok };
  } catch (err) {
    return { ok: false, error: err instanceof DOMException && err.name === "AbortError" ? "Request timed out" : err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get<T>(url: string): Promise<ApiResponse<T>> {
    return request<T>(url);
  },

  post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    return request<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  put<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    return request<T>(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  patch<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    return request<T>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  delete<T>(url: string): Promise<ApiResponse<T>> {
    return request<T>(url, { method: "DELETE" });
  },
};
