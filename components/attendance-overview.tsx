"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import {
  getAttendanceStatusLabel,
  getAttendanceStatusMarker,
  getAttendanceStatusShortLabel,
  getAttendanceStatusTone,
} from "@/lib/attendance";
import type { AttendanceStatus, Member, WeeklyMemberRecord } from "@/lib/types";

const attendanceOptions: Array<{
  value: AttendanceStatus;
  selectedClassName: string;
}> = [
  { value: "present", selectedClassName: "border-green-600 bg-green-600 text-white" },
  { value: "absent", selectedClassName: "border-rose-600 bg-rose-600 text-white" },
  { value: "excused", selectedClassName: "border-amber-500 bg-amber-500 text-white" },
  { value: "unknown", selectedClassName: "border-slate-500 bg-slate-500 text-white" },
];

const memberStatusStyles: Record<AttendanceStatus, string> = {
  present: "border-green-300 bg-green-50 text-green-800 hover:bg-green-100",
  absent: "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100",
  excused: "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
  unknown: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
};

const memberStatusDots: Record<AttendanceStatus, string> = {
  present: "bg-green-500",
  absent: "bg-rose-500",
  excused: "bg-amber-500",
  unknown: "bg-slate-300",
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
  const [inputMode, setInputMode] = useState<AttendanceStatus>("present");
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
    <Card variant="input">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">출결 한눈에 입력</h2>
          <p className="mt-1 text-sm text-slate-500">상태를 고른 뒤 명단에서 해당하는 사람들을 연속으로 선택합니다.</p>
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
          <Badge key={option.value} tone={getAttendanceStatusTone(option.value)}>
            {getAttendanceStatusMarker(option.value)} {getAttendanceStatusLabel(option.value)} {counts[option.value]}명
          </Badge>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold">입력할 상태</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2" role="group" aria-label="출결 입력 상태 선택">
          {attendanceOptions.map((option) => {
            const selected = inputMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                className={`focus-ring min-h-10 whitespace-nowrap rounded-xl border px-1 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
                  selected
                    ? option.selectedClassName
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setInputMode(option.value)}
              >
                <span aria-hidden="true">{getAttendanceStatusMarker(option.value)} </span>
                {getAttendanceStatusLabel(option.value)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6" role="group" aria-label="출결 명단">
        {members.map((member) => {
          const status = getStatus(member.member_id);
          const statusLabel = getAttendanceStatusLabel(status);
          const inputModeLabel = getAttendanceStatusLabel(inputMode);
          return (
            <button
              key={member.member_id}
              type="button"
              className={`focus-ring flex min-h-10 min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition ${memberStatusStyles[status]}`}
              aria-label={`${member.display_name}, 현재 ${statusLabel}, ${inputModeLabel}으로 변경`}
              onClick={() => onChange(member.member_id, inputMode)}
              title={`${member.display_name} · ${statusLabel}`}
            >
              <span className={`size-2 shrink-0 rounded-full ${memberStatusDots[status]}`} aria-hidden="true" />
              <span className="shrink-0 rounded bg-white/70 px-1 text-[10px] font-bold" aria-hidden="true">
                {getAttendanceStatusShortLabel(status)}
              </span>
              <span className="min-w-0 truncate text-xs font-semibold sm:text-sm">{member.display_name}</span>
            </button>
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
