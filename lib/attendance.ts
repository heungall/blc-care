import type { AttendanceStatus } from "@/lib/types";

export const attendanceStatusOptions: ReadonlyArray<{
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  marker: string;
  tone: "success" | "danger" | "warning" | "neutral";
}> = [
  { value: "present", label: "출석", shortLabel: "출", marker: "✓", tone: "success" },
  { value: "absent", label: "결석", shortLabel: "결", marker: "×", tone: "danger" },
  { value: "excused", label: "사유 결석", shortLabel: "사", marker: "!", tone: "warning" },
  { value: "unknown", label: "미확인", shortLabel: "미", marker: "?", tone: "neutral" },
];

const attendanceStatusMap = Object.fromEntries(
  attendanceStatusOptions.map((option) => [option.value, option]),
) as Record<AttendanceStatus, (typeof attendanceStatusOptions)[number]>;

export function getAttendanceStatusLabel(status: AttendanceStatus) {
  return attendanceStatusMap[status].label;
}

export function getAttendanceStatusTone(status: AttendanceStatus) {
  return attendanceStatusMap[status].tone;
}

export function getAttendanceStatusShortLabel(status: AttendanceStatus) {
  return attendanceStatusMap[status].shortLabel;
}

export function getAttendanceStatusMarker(status: AttendanceStatus) {
  return attendanceStatusMap[status].marker;
}
