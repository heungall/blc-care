import { describe, expect, it } from "vitest";
import { getLongAbsenceWorkItems, getWeeklyReportWorkItems } from "@/lib/dashboard";
import type { Cell, MemberView } from "@/lib/types";

const cells = [
  { cell_id: "cell_a", cell_name: "A셀", active: true, created_at: "", updated_at: "" },
  { cell_id: "cell_b", cell_name: "B셀", active: true, created_at: "", updated_at: "" },
] satisfies Cell[];

describe("dashboard work item helpers", () => {
  it("marks cells without this week report as missing", () => {
    const items = getWeeklyReportWorkItems(cells, [
      { report_id: "report_a", cell_id: "cell_a", week_start_date: "2026-06-14", status: "submitted" },
      { report_id: "old_report_b", cell_id: "cell_b", week_start_date: "2026-06-07", status: "submitted" },
    ], "2026-06-18");

    expect(items).toEqual([
      { cell_id: "cell_a", cell_name: "A셀", report_id: "report_a", status: "submitted" },
      { cell_id: "cell_b", cell_name: "B셀", report_id: undefined, status: "missing" },
    ]);
  });

  it("finds active or dormant members beyond the absence threshold", () => {
    const members = [
      member("old_active", "오래된성도", "active", "2026-03-01"),
      member("recent_active", "최근성도", "active", "2026-06-01"),
      member("left_old", "이탈성도", "left", "2026-01-01"),
      member("no_record", "기록없는성도", "dormant", undefined),
    ];

    expect(getLongAbsenceWorkItems(members, "2026-06-18", 3).map((item) => item.member_id)).toEqual([
      "no_record",
      "old_active",
    ]);
  });
});

function member(
  member_id: string,
  display_name: string,
  status: MemberView["status"],
  last_attendance_date: string | undefined,
): MemberView {
  return {
    member_id,
    full_name: display_name,
    display_name,
    name_aliases: [],
    current_cell_id: "cell_a",
    current_cell_name: "A셀",
    status,
    created_at: "",
    updated_at: "",
    last_attendance_date,
    unresolved_note_count: 0,
  };
}
