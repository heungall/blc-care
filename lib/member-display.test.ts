import { describe, expect, it } from "vitest";
import { getMemberInitial } from "@/lib/member-display";

describe("member display helpers", () => {
  it("uses the first character of a Korean name", () => {
    expect(getMemberInitial("김철수")).toBe("김");
  });

  it("ignores surrounding whitespace", () => {
    expect(getMemberInitial("  박영희  ")).toBe("박");
  });

  it("uses a safe fallback for an empty name", () => {
    expect(getMemberInitial("   ")).toBe("?");
  });
});
