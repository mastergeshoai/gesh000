import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), limit: vi.fn(), where: vi.fn(), listProviders: vi.fn(), createProvider: vi.fn(), disableProvider: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/lib/db", () => ({ db: { select: () => ({ from: () => ({ where: mocks.where }) }) } }));
vi.mock("@/lib/control-plane/service", () => ({
  listProviders: mocks.listProviders, createProvider: mocks.createProvider, disableProvider: mocks.disableProvider,
  availableProviderAdapters: () => [],
}));

import { AdminAccessError, getCurrentAdmin, requireAdmin } from "@/lib/admin";
import { GET, POST } from "@/app/api/control-plane/providers/route";
import { PATCH } from "@/app/api/control-plane/providers/[providerId]/route";
import { eq } from "drizzle-orm";
import { userRoles } from "@/lib/db/schema";

const member = { id: "member-123", email: "member@example.com" };
const definition = { slug: "vcaas", name: "Totalum VCaaS", adapterKey: "vcaaS", capabilities: { chat: true } };
const request = (body: unknown) => new Request("http://localhost/api/control-plane/providers", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.where.mockReturnValue({ limit: mocks.limit });
  mocks.getSession.mockResolvedValue(null);
  mocks.limit.mockResolvedValue([]);
  mocks.listProviders.mockResolvedValue([]);
});

describe("server-side administrator authorization", () => {
  it("rejects unauthenticated requests without querying roles", async () => {
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
    expect(await getCurrentAdmin()).toBeNull();
    expect(mocks.where).not.toHaveBeenCalled();
  });

  it.each([[], [{ role: "member" }], [{ role: "user" }]])("denies users without an admin database role: %j", async (...roles) => {
    mocks.getSession.mockResolvedValue({ user: { ...member, role: "admin" } });
    mocks.limit.mockResolvedValue(roles);
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAccessError);
    expect(await getCurrentAdmin()).toBeNull();
    expect(mocks.where).toHaveBeenCalledWith(eq(userRoles.userId, member.id));
  });

  it("accepts only the authenticated user with a persisted admin role", async () => {
    mocks.getSession.mockResolvedValue({ user: member });
    mocks.limit.mockResolvedValue([{ role: "admin" }]);
    expect(await requireAdmin()).toEqual(member);
  });

  it.each([401, 403])("blocks all provider API operations with status %s", async (status) => {
    if (status === 403) mocks.getSession.mockResolvedValue({ user: member });
    expect((await GET()).status).toBe(status);
    expect((await POST(request(definition))).status).toBe(status);
    expect((await PATCH(request({ status: "disabled" }), { params: Promise.resolve({ providerId: "another-users-provider" }) })).status).toBe(status);
    expect(mocks.listProviders).not.toHaveBeenCalled();
    expect(mocks.createProvider).not.toHaveBeenCalled();
    expect(mocks.disableProvider).not.toHaveBeenCalled();
  });

  it("scopes admin provider operations to the session user", async () => {
    mocks.getSession.mockResolvedValue({ user: member });
    mocks.limit.mockResolvedValue([{ role: "admin" }]);
    mocks.createProvider.mockResolvedValue({ id: "provider-123" });
    expect((await GET()).status).toBe(200);
    expect((await POST(request({ ...definition, userId: "forged-user" }))).status).toBe(201);
    expect(mocks.listProviders).toHaveBeenCalledWith(member.id);
    expect(mocks.createProvider).toHaveBeenCalledWith(member.id, definition);
  });

  it("rejects malformed provider input", async () => {
    mocks.getSession.mockResolvedValue({ user: member });
    mocks.limit.mockResolvedValue([{ role: "admin" }]);
    expect((await POST(request({ ...definition, capabilities: [] }))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/control-plane/providers", { method: "POST", body: "{" }))).status).toBe(400);
    expect(mocks.createProvider).not.toHaveBeenCalled();
  });

  it("does not misreport a database outage as an authorization denial", async () => {
    mocks.getSession.mockResolvedValue({ user: member });
    mocks.limit.mockRejectedValue(new Error("Database unavailable"));
    expect((await GET()).status).toBe(500);
  });
});
