import { describe, expect, it } from "vitest";
import {
  parseAliases,
  parseRoles,
  serializeAliases,
  serializeRoles,
} from "@/lib/types";
import { mockMembers } from "@/lib/mock-data";

describe("DB comma-separated transformations", () => {
  it("parses and serializes roles without duplicates", () => {
    expect(parseRoles("admin, cell_leader,admin")).toEqual(["admin", "cell_leader"]);
    expect(serializeRoles(["admin", "cell_leader", "admin"])).toBe("admin,cell_leader");
  });

  it("parses and serializes name aliases", () => {
    expect(parseAliases("샘플하늘, 하늘,샘플하늘")).toEqual(["샘플하늘", "하늘"]);
    expect(serializeAliases(["샘플하늘", " 하늘 ", "샘플하늘"])).toBe("샘플하늘,하늘");
  });

  it("supports optional member workplace details", () => {
    expect(mockMembers[0]).toMatchObject({
      workplace: "샘플 회사 A",
      occupation: "샘플 직업 A",
      job_title: "샘플 직책 A",
    });
  });
});
