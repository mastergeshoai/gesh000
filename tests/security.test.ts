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
});
