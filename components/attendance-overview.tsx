"use client";

import { Badge, Button, Card } from "@/components/ui";
import type { AttendanceStatus, Member, WeeklyMemberRecord } from "@/lib/types";

const attendanceOptions: Array<{
  value: AttendanceStatus;
  label: string;
  selectedClassName: string;
}> = [
  { value: "present", label: "출석", selectedClassName: "border-green-600 bg-green-600 text-white" },
  { value: "absent", label: "결석", selectedClassName: "border-rose-600 bg-rose-600 text-white" },
  { value: "excused", label: "사유 결석", selectedClassName: "border-amber-500 bg-amber-500 text-white" },
  { value: "unknown", label: "미확인", selectedClassName: "border-slate-500 bg-slate-500 text-white" },
];

const attendanceLabels: Record<AttendanceStatus, string> = {
  present: "출석",
  absent: "결석",
  excused: "사유 결석",
  unknown: "미확인",
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
          <p className="mt-1 text-sm text-slate-500">먼저 전체 인원의 출결을 확인한 뒤 나눔 작성으로 이동합니다.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => members.forEach((member) => onChange(member.member_id, "present"))}
        >
          모두 출석
        </Button>
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
            <div key={member.member_id} className="py-3 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(24rem,2fr)] sm:items-center sm:gap-4">
              <div className="mb-2 flex items-center justify-between gap-3 sm:mb-0">
                <span className="font-semibold">{member.display_name}</span>
                <span className="text-xs text-slate-500 sm:hidden">{attendanceLabels[status]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={`${member.display_name} 출결 상태`}>
                {attendanceOptions.map((option) => {
                  const selected = status === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      className={`focus-ring min-h-10 rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                        selected
                          ? option.selectedClassName
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => onChange(member.member_id, option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
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
