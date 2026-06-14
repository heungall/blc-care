import { describe, expect, it } from "vitest";
import { createMemberCsvTemplate, parseMemberCsv } from "@/lib/member-csv";

describe("member CSV parser", () => {
  it("parses the sample template and normalizes aliases", () => {
    const result = parseMemberCsv(createMemberCsvTemplate());
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      full_name: "홍길동",
      display_name: "홍길동",
      name_aliases: ["길동", "길동형제"],
      cell_name: "샘플 1셀",
      status: "active",
    });
  });

  it("supports quoted commas and defaults display name and status", () => {
    const result = parseMemberCsv("full_name,display_name,address,status\n홍길동,,\"서울시 샘플구, 샘플동\",\n");
    expect(result.errors).toEqual([]);
    expect(result.rows[0]?.display_name).toBe("홍길동");
    expect(result.rows[0]?.address).toBe("서울시 샘플구, 샘플동");
    expect(result.rows[0]?.status).toBe("active");
  });

  it("rejects missing required headers and invalid values", () => {
    expect(parseMemberCsv("display_name\n샘플").errors[0]?.message).toContain("full_name");
    expect(parseMemberCsv("full_name,status\n홍길동,invalid").errors[0]?.message).toContain("status");
  });

  it("does not include sensitive row values in validation messages", () => {
    const result = parseMemberCsv("full_name,birth_date\n민감한이름,not-a-date");
    expect(result.errors[0]?.message).not.toContain("민감한이름");
    expect(result.errors[0]?.message).not.toContain("not-a-date");
  });
});
