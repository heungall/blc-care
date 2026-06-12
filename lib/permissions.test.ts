import { describe, expect, it } from "vitest";
import { mockAssignments, mockMembers, mockReports, mockUsers } from "@/lib/mock-data";
import {
  canAccessMember,
  canEditReport,
  getAssignedCellIds,
  isAssignmentActive,
} from "@/lib/permissions";

describe("permission helpers", () => {
  it("supports users with both roles", () => {
    expect(mockUsers[2].roles).toEqual(["admin", "cell_leader"]);
    expect(getAssignedCellIds(mockUsers[2], mockAssignments, "2026-06-12")).toEqual(["cell_b"]);
  });

  it("checks assignment date ranges", () => {
    expect(isAssignmentActive({ ...mockAssignments[0], end_date: "2026-06-11" }, "2026-06-12")).toBe(false);
  });

  it("restricts a leader to assigned cell members", () => {
    expect(canAccessMember(mockUsers[1], mockMembers[0], mockAssignments, "2026-06-12")).toBe(true);
    expect(canAccessMember(mockUsers[1], mockMembers[2], mockAssignments, "2026-06-12")).toBe(false);
  });

  it("allows admin to edit a past report", () => {
    expect(canEditReport(mockUsers[0], mockReports[0], mockAssignments, "2026-06-12")).toBe(true);
  });

  it("allows a leader only during the assigned report week", () => {
    expect(canEditReport(mockUsers[1], mockReports[0], mockAssignments, "2026-06-05")).toBe(true);
    expect(canEditReport(mockUsers[1], mockReports[0], mockAssignments, "2026-06-12")).toBe(false);
  });

  it("blocks inactive users", () => {
    expect(canEditReport(mockUsers[3], mockReports[0], mockAssignments, "2026-06-05")).toBe(false);
  });
});
