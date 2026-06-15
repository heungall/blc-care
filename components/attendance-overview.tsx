"use client";

import { Badge, Button, Card } from "@/components/ui";
import type { AttendanceStatus, Member, WeeklyMemberRecord } from "@/lib/types";

const attendanceOptions: Array<{
  value: AttendanceStatus;
  label: string;
}> = [
  { value: "present", label: "출석" },
  { value: "absent", label: "결석" },
  { value: "excused", label: "사유 결석" },
  { value: "unknown", label: "미확인" },
];

const statusStyles: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-rose-100 text-rose-700",
  excused: "bg-amber-100 text-amber-800",
  unknown: "bg-slate-100 text-slate-600",
};

export function AttendanceOverview({
  members,
  records,
  onChange,
}: {
  members: Member[];
  records: WeeklyMemberRecord[];
  onChange: (memberId: string, status: AttendanceStatus) => void;
}) {
  const getStatus = (memberId: string) =>
    records.find((record) => record.member_id === memberId)?.attendance_status ?? "unknown";
  const counts = attendanceOptions.reduce<Record<AttendanceStatus, number>>(
    (result, option) => ({
      ...result,
      [option.value]: members.filter((member) => getStatus(member.member_id) === option.value).length,
    }),
    { present: 0, absent: 0, excused: 0, unknown: 0 },
  );

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">출결 한눈에 입력</h2>
          <p className="mt-1 text-sm text-slate-500">출석한 사람만 선택한 뒤, 남은 인원을 결석으로 처리합니다.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => members.forEach((member) => onChange(member.member_id, "present"))}
          >
            모두 출석
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => members.forEach((member) => {
              if (getStatus(member.member_id) === "unknown") onChange(member.member_id, "absent");
            })}
          >
            미선택 인원 결석 처리
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="출결 현황">
        {attendanceOptions.map((option) => (
          <Badge key={option.value} tone={option.value === "present" ? "success" : option.value === "absent" ? "danger" : option.value === "excused" ? "warning" : "neutral"}>
            {option.label} {counts[option.value]}명
          </Badge>
        ))}
      </div>

      <div className="mt-5 divide-y divide-slate-100 border-y border-slate-200">
        {members.map((member) => {
          const status = getStatus(member.member_id);
          return (
            <div key={member.member_id} className="flex items-center gap-2 py-3">
              <button
                type="button"
                aria-pressed={status === "present"}
                className={`focus-ring flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                  status === "present"
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                onClick={() => onChange(member.member_id, status === "present" ? "unknown" : "present")}
              >
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
                  status === "present" ? "border-green-600 bg-green-600 text-white" : "border-slate-300 text-transparent"
                }`}>
                  ✓
                </span>
                <span className="truncate text-sm font-semibold sm:text-base">{member.display_name}</span>
                <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
                  {attendanceOptions.find((option) => option.value === status)?.label}
                </span>
              </button>
              <select
                aria-label={`${member.display_name} 출결 상태 직접 변경`}
                className="focus-ring min-h-11 w-24 shrink-0 rounded-xl border border-slate-300 bg-white px-2 text-xs sm:w-28 sm:text-sm"
                value={status}
                onChange={(event) => onChange(member.member_id, event.target.value as AttendanceStatus)}
              >
                {attendanceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          );
        })}
      </div>

      {counts.unknown > 0 && (
        <p className="mt-4 text-sm font-semibold text-amber-800">
          아직 확인하지 않은 인원이 {counts.unknown}명 있습니다.
        </p>
      )}
    </Card>
  );
}
