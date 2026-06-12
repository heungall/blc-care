import { describe, expect, it } from "vitest";
import { calculateLongAbsenceCandidates, getLatestAttendanceDate } from "@/lib/absence";
import { mockMembers, mockReports } from "@/lib/mock-data";

const records = mockReports.flatMap((report) => report.records);

describe("long absence helpers", () => {
  it("finds the latest present attendance date", () => {
    expect(getLatestAttendanceDate("member_a1", records)).toBe("2026-06-07");
  });

  it("uses registration date when a member has no present record", () => {
    const candidates = calculateLongAbsenceCandidates(mockMembers, records, "2026-06-12", 3);
    expect(candidates.some((candidate) => candidate.member.member_id === "member_b2")).toBe(true);
  });

  it("excludes recently attended members", () => {
    const candidates = calculateLongAbsenceCandidates(mockMembers, records, "2026-06-12", 3);
    expect(candidates.some((candidate) => candidate.member.member_id === "member_a1")).toBe(false);
  });
});
