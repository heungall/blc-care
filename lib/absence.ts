import { addMonths, completeMonthsBetween } from "@/lib/date";
import type {
  DateString,
  LongAbsenceCandidate,
  Member,
  WeeklyMemberRecord,
} from "@/lib/types";

export function getLatestAttendanceDate(
  memberId: string,
  records: WeeklyMemberRecord[],
): DateString | undefined {
  return records
    .filter((record) => record.member_id === memberId && record.attendance_status === "present")
    .map((record) => record.report_date ?? record.week_start_date)
    .sort()
    .at(-1);
}

export function calculateLongAbsenceCandidates(
  members: Member[],
  records: WeeklyMemberRecord[],
  asOfDate: DateString,
  thresholdMonths: number,
): LongAbsenceCandidate[] {
  if (thresholdMonths < 1) throw new Error("thresholdMonths must be at least 1");

  return members
    .filter((member) => member.status === "active" || member.status === "dormant")
    .flatMap((member) => {
      const last_attended_date = getLatestAttendanceDate(member.member_id, records);
      const baseline_date = last_attended_date ?? member.registration_date ?? member.first_visit_date;
      if (!baseline_date || addMonths(baseline_date, thresholdMonths) > asOfDate) return [];

      return [{
        member,
        last_attended_date,
        baseline_date,
        absence_months: completeMonthsBetween(baseline_date, asOfDate),
      }];
    })
    .sort((a, b) => a.baseline_date.localeCompare(b.baseline_date));
}
