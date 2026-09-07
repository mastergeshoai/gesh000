export type ProviderStatus = "active" | "disabled" | "degraded" | "retired";
export type ModelStatus = "active" | "disabled" | "retired";
export type ConnectionStatus = "active" | "disabled" | "draining";
export type HealthState = "unknown" | "healthy" | "degraded" | "unhealthy";
export type RoutingStrategy = "priority" | "weighted" | "health";
export type RequestStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface ProviderDescriptor {
  slug: string;
  name: string;
  adapterKey: string;
  capabilities: Record<string, boolean>;
}

export interface ModelDescriptor {
  modelKey: string;
  displayName: string;
  capabilities: Record<string, boolean>;
  limits: Record<string, number>;
  pricing: { inputMicros?: number; outputMicros?: number };
}

export interface ProviderFixture {
  provider: ProviderDescriptor;
  models: ModelDescriptor[];
}

export const vcaaSFixture: ProviderFixture = {
  provider: { slug: "vcaas", name: "Totalum VCaaS", adapterKey: "vcaaS", capabilities: { chat: true, files: true, sandbox: true } },
  models: [],
};

export function isProviderStatus(value: string): value is ProviderStatus {
  return ["active", "disabled", "degraded", "retired"].includes(value);
}

export function isRoutingStrategy(value: string): value is RoutingStrategy {
  return ["priority", "weighted", "health"].includes(value);
}
