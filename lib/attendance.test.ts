import { describe, expect, it } from "vitest";
import {
  attendanceStatusOptions,
  getAttendanceStatusLabel,
  getAttendanceStatusTone,
} from "@/lib/attendance";
import type { AttendanceStatus } from "@/lib/types";

describe("attendance status display", () => {
  it.each([
    ["present", "출석", "success"],
    ["absent", "결석", "danger"],
    ["excused", "사유 결석", "warning"],
    ["unknown", "미확인", "neutral"],
  ] satisfies Array<[AttendanceStatus, string, string]>)(
    "maps %s to its Korean label and badge tone",
    (status, label, tone) => {
      expect(getAttendanceStatusLabel(status)).toBe(label);
      expect(getAttendanceStatusTone(status)).toBe(tone);
    },
  );

  it("contains every attendance status exactly once", () => {
    expect(attendanceStatusOptions.map((option) => option.value)).toEqual([
      "present",
      "absent",
      "excused",
      "unknown",
    ]);
  });
});
