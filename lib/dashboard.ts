import { addMonths, getWeekRange } from "@/lib/date";
import type { Cell, DateString, MemberStatus, MemberView, ReportStatus } from "@/lib/types";

type DashboardReport = {
  report_id: string;
  cell_id: string;
  week_start_date: DateString;
  status: ReportStatus;
};

export type WeeklyReportWorkItem = {
  cell_id: string;
  cell_name: string;
  report_id?: string;
  status: ReportStatus | "missing";
};

export type LongAbsenceWorkItem = {
  member_id: string;
  display_name: string;
  current_cell_name?: string;
  last_attendance_date?: DateString;
};

const absenceCandidateStatuses: MemberStatus[] = ["active", "dormant"];

export function getWeeklyReportWorkItems(
  cells: Cell[],
  reports: DashboardReport[],
  today: DateString,
): WeeklyReportWorkItem[] {
  const week = getWeekRange(today);
  return cells.map((cell) => {
    const report = reports.find((item) =>
      item.cell_id === cell.cell_id && item.week_start_date === week.week_start_date,
    );
    return {
      cell_id: cell.cell_id,
      cell_name: cell.cell_name,
      report_id: report?.report_id,
      status: report?.status ?? "missing",
    };
  });
}

export function getLongAbsenceWorkItems(
  members: MemberView[],
  today: DateString,
  thresholdMonths: number,
): LongAbsenceWorkItem[] {
  const normalizedThreshold = Math.max(1, thresholdMonths);
  return members
    .filter((member) => absenceCandidateStatuses.includes(member.status))
    .filter((member) => !member.last_attendance_date || addMonths(member.last_attendance_date, normalizedThreshold) <= today)
    .sort((a, b) => (a.last_attendance_date ?? "").localeCompare(b.last_attendance_date ?? ""))
    .map((member) => ({
      member_id: member.member_id,
      display_name: member.display_name,
      current_cell_name: member.current_cell_name,
      last_attendance_date: member.last_attendance_date,
    }));
}
