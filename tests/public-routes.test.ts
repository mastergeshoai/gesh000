import { describe, expect, it } from "vitest";

const publicPaths = ["/", "/about", "/contact", "/pricing", "/sign-in", "/sign-up"];
const protectedPaths = ["/account", "/project/demo", "/control-plane/providers", "/runtime-health"];

function isPublic(pathname: string) {
  return pathname === "/" || ["/about", "/contact", "/pricing", "/sign-in", "/sign-up"].some((path) => pathname.startsWith(path));
}

describe("route access policy", () => {
  it("keeps marketing and auth routes public", () => {
    for (const path of publicPaths) expect(isPublic(path)).toBe(true);
  });

  it("keeps account and workspace routes protected", () => {
    for (const path of protectedPaths) expect(isPublic(path)).toBe(false);
  });
});
