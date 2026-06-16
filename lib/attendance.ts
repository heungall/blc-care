import type { AttendanceStatus } from "@/lib/types";

export const attendanceStatusOptions: ReadonlyArray<{
  value: AttendanceStatus;
  label: string;
  tone: "success" | "danger" | "warning" | "neutral";
}> = [
  { value: "present", label: "출석", tone: "success" },
  { value: "absent", label: "결석", tone: "danger" },
  { value: "excused", label: "사유 결석", tone: "warning" },
  { value: "unknown", label: "미확인", tone: "neutral" },
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
