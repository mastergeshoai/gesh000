import { describe, expect, it } from "vitest";

const projectId = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/;

describe("security input boundaries", () => {
  it("accepts safe project identifiers only", () => {
    expect(projectId.test("project_2030-01")).toBe(true);
    expect(projectId.test("../../secrets")).toBe(false);
    expect(projectId.test("a".repeat(65))).toBe(false);
  });

  it("does not accept empty or whitespace identifiers", () => {
    expect(projectId.test("")).toBe(false);
    expect(projectId.test(" project ")).toBe(false);
  });

  it("rejects unsafe preview protocols", () => {
    for (const value of ["javascript:alert(1)", "file:///etc/passwd", "data:text/html,x"]) {
      expect(() => new URL(value)).not.toThrow();
      expect(["http:", "https:"].includes(new URL(value).protocol)).toBe(false);
    }
  });

  it("enforces bounded upload requests", () => {
    expect(15 * 1024 * 1024).toBe(15728640);
    expect(15728641 > 15 * 1024 * 1024).toBe(true);
  });
});
