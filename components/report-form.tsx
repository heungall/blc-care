"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AttendanceOverview } from "@/components/attendance-overview";
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import { MemberContentBulkInput } from "@/components/member-content-bulk-input";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Select, Textarea } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import { attendanceStatusOptions, getAttendanceStatusLabel } from "@/lib/attendance";
import { getTodayInTimeZone, getWeekRange } from "@/lib/date";
import type { WeeklyMemberRecord } from "@/lib/types";

export function ReportForm() {
  const router = useRouter();
  const { user, leaderMode } = useAuth();
  const scope = leaderMode ? "leader" : "admin";
  const cellsState = useApiData(() => api.getCells(user, { scope }), [user.email, leaderMode]);
  const cells = useMemo(() => cellsState.data ?? [], [cellsState.data]);
  const [cellId, setCellId] = useState("");
  const [sharings, setSharings] = useState<Record<string, string>>({});
  const [prayers, setPrayers] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<WeeklyMemberRecord[]>([]);
  const [summary, setSummary] = useState("");
  const [reportDate, setReportDate] = useState(getTodayInTimeZone());
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"attendance" | "details">("attendance");
  const [additionalDetailMemberIds, setAdditionalDetailMemberIds] = useState<string[]>([]);
  const week = getWeekRange(getTodayInTimeZone());
  const draftState = useApiData(
    () => cellId ? api.getWeeklyReportDraft(user, cellId, week.week_start_date, { scope }) : Promise.resolve(null),
    [user.email, cellId, week.week_start_date, leaderMode],
  );

  useEffect(() => {
    if (!cellId && cells[0]) setCellId(cells[0].cell_id);
  }, [cellId, cells]);

  useEffect(() => {
    if (draftState.data) {
      setRecords(draftState.data.records);
      setSummary(draftState.data.report.overall_summary ?? "");
      setReportDate(draftState.data.report.report_date ?? getTodayInTimeZone());
    }
  }, [draftState.data]);

  const members = draftState.data?.members ?? [];
  const changeCell = (nextCellId: string) => {
    setCellId(nextCellId);
    setSharings({});
    setPrayers({});
    setRecords([]);
    setMessage("");
    setSaveError("");
    setStep("attendance");
    setAdditionalDetailMemberIds([]);
  };
  const updateRecord = (memberId: string, patch: Partial<WeeklyMemberRecord>) => {
    setRecords((items) => {
      const current = items.find((item) => item.member_id === memberId);
      if (current) return items.map((item) => item.member_id === memberId ? { ...item, ...patch } : item);
      return [...items, {
        record_id: "",
        report_id: draftState.data?.report.report_id ?? "",
        member_id: memberId,
        cell_id: cellId,
        week_start_date: week.week_start_date,
        attendance_status: "unknown",
        created_at: "",
        updated_at: "",
        ...patch,
      }];
    });
  };
  const applyContents = (kind: "sharing" | "prayer", contents: Record<string, string>) => {
    if (kind === "sharing") setSharings((current) => ({ ...current, ...contents }));
    else setPrayers((current) => ({ ...current, ...contents }));
    Object.entries(contents).forEach(([memberId, content]) => {
      updateRecord(memberId, kind === "sharing" ? { sharing_summary: content } : { prayer_request: content, prayer_parsed_by: "rule" });
    });
  };
  const save = async (status: "draft" | "submitted") => {
    if (!cellId) return;
    setSaving(true);
    setMessage("");
    setSaveError("");
    try {
      await api.saveWeeklyReport(user, {
        report_id: draftState.data?.report.report_id || undefined,
        cell_id: cellId,
        week_start_date: week.week_start_date,
        report_date: reportDate,
        overall_summary: summary,
        status,
        records: members.map((member) => {
          const record = records.find((item) => item.member_id === member.member_id);
          return {
            ...record,
            member_id: member.member_id,
            attendance_status: record?.attendance_status ?? "unknown",
            sharing_summary: sharings[member.member_id] ?? record?.sharing_summary ?? "",
            prayer_request: prayers[member.member_id] ?? record?.prayer_request ?? "",
          };
        }),
      }, { scope });
      if (status === "submitted") {
        router.replace("/dashboard");
        return;
      }
      setMessage("임시저장했습니다.");
      void draftState.reload();
    } catch (error) {
      setSaveError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (cellsState.loading) return <LoadingState>작성 가능한 셀을 확인하는 중입니다.</LoadingState>;
  if (cellsState.error) return <ErrorState onRetry={() => void cellsState.reload()}>{cellsState.error}</ErrorState>;
  if (!cells.length) return <EmptyState>현재 작성 가능한 셀이 없습니다. 관리자에게 문의해주세요.</EmptyState>;

  const attendanceCounts = members.reduce(
    (counts, member) => {
      const status = records.find((record) => record.member_id === member.member_id)?.attendance_status ?? "unknown";
      counts[status] += 1;
      return counts;
    },
    { present: 0, absent: 0, excused: 0, unknown: 0 },
  );
  const getMemberRecord = (memberId: string) => records.find((record) => record.member_id === memberId);
  const hasMemberContent = (memberId: string) => {
    const record = getMemberRecord(memberId);
    return Boolean(
      sharings[memberId]
      || prayers[memberId]
      || record?.sharing_summary
      || record?.prayer_request,
    );
  };
  const presentMembers = members.filter((member) => getMemberRecord(member.member_id)?.attendance_status === "present");
  const detailMembers = members.filter((member) =>
    getMemberRecord(member.member_id)?.attendance_status === "present"
    || additionalDetailMemberIds.includes(member.member_id)
    || hasMemberContent(member.member_id),
  );
  const optionalDetailMembers = members.filter((member) => !detailMembers.includes(member));

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <ol className="grid grid-cols-2 gap-2" aria-label="리포트 작성 단계">
        <li className={`rounded-xl border px-4 py-3 text-sm font-semibold ${step === "attendance" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500"}`}>
          1. 출결 입력
        </li>
        <li className={`rounded-xl border px-4 py-3 text-sm font-semibold ${step === "details" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500"}`}>
          2. 나눔 작성
        </li>
      </ol>

      <Card>
        <h2 className="text-lg font-bold">리포트 기본 정보</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">셀<Select className="mt-2" value={cellId} onChange={(event) => changeCell(event.target.value)}>{cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select></label>
          <label className="text-sm font-semibold">주차<Input className="mt-2" value={`${week.week_start_date} ~ ${week.week_end_date}`} readOnly /></label>
          <label className="text-sm font-semibold">모임일<Input className="mt-2" type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} /></label>
        </div>
      </Card>

      {draftState.loading && <LoadingState>리포트 초안을 불러오는 중입니다.</LoadingState>}
      {draftState.error && <ErrorState onRetry={() => void draftState.reload()}>{draftState.error}</ErrorState>}
      {!draftState.loading && !draftState.error && draftState.data && (
        <>
          {step === "attendance" ? (
            <AttendanceOverview
              members={members}
              records={records}
              onChange={(memberId, attendanceStatus) => updateRecord(memberId, { attendance_status: attendanceStatus })}
            />
          ) : (
            <>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">출결 입력 결과</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attendanceStatusOptions.map((option) => (
                        <Badge key={option.value} tone={option.tone}>{option.label} {attendanceCounts[option.value]}명</Badge>
                      ))}
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setStep("attendance")}>출결 수정</Button>
                </div>
              </Card>
              <Card>
                <h2 className="text-lg font-bold">전체 나눔 요약</h2>
                <label className="mt-4 block text-sm font-semibold">요약 내용<Textarea className="mt-2 min-h-24" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="민감한 내용을 과하게 자세히 적지 않도록 확인해주세요." /></label>
              </Card>
              <MemberContentBulkInput members={presentMembers} contentLabel="나눔" placeholder={"이름: 나눔 내용을 입력해주세요\n이름: 다음 나눔 내용을 입력해주세요"} onConfirm={(contents) => applyContents("sharing", contents)} />
              <MemberContentBulkInput members={presentMembers} contentLabel="기도제목" placeholder={"이름: 기도제목을 입력해주세요\n이름: 다음 기도제목을 입력해주세요"} onConfirm={(contents) => applyContents("prayer", contents)} />
              <section>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-bold">출석 인원 기록</h2>
                  <p className="text-sm text-slate-500">출석한 사람만 기본으로 표시합니다. 비출석 인원은 필요한 경우 아래에서 추가할 수 있습니다.</p>
                </div>
                <div className="mt-4 space-y-4">
                  {detailMembers.map((member) => {
                    const record = getMemberRecord(member.member_id);
                    return (
                      <Card key={member.member_id}>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-bold">{member.display_name}</h3>
                          <AttendanceStatusBadge status={record?.attendance_status ?? "unknown"} />
                        </div>
                        <label className="mt-4 block text-sm font-semibold">개인 나눔 요약<Textarea className="mt-2 min-h-20" value={sharings[member.member_id] ?? record?.sharing_summary ?? ""} onChange={(event) => { setSharings((current) => ({ ...current, [member.member_id]: event.target.value })); updateRecord(member.member_id, { sharing_summary: event.target.value }); }} /></label>
                        <label className="mt-4 block text-sm font-semibold">기도제목<Textarea className="mt-2 min-h-20" value={prayers[member.member_id] ?? record?.prayer_request ?? ""} onChange={(event) => { setPrayers((current) => ({ ...current, [member.member_id]: event.target.value })); updateRecord(member.member_id, { prayer_request: event.target.value }); }} /></label>
                      </Card>
                    );
                  })}
                  {!detailMembers.length && <EmptyState>기록을 작성할 출석 인원이 없습니다.</EmptyState>}
                </div>
              </section>
              {optionalDetailMembers.length > 0 && (
                <Card>
                  <h2 className="text-base font-bold">비출석 인원 기록 추가</h2>
                  <p className="mt-1 text-sm text-slate-500">나중에 기록이 필요한 사람만 선택해주세요.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {optionalDetailMembers.map((member) => {
                      const status = getMemberRecord(member.member_id)?.attendance_status ?? "unknown";
                      return (
                        <button
                          key={member.member_id}
                          type="button"
                          className="focus-ring rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => setAdditionalDetailMemberIds((ids) => [...ids, member.member_id])}
                        >
                          + {member.display_name} · {getAttendanceStatusLabel(status)}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
      <div className="sticky bottom-16 z-10 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end lg:bottom-4">
        {message && <p className="mr-auto self-center text-sm font-semibold text-green-700">{message}</p>}
        {saveError && <p className="mr-auto self-center text-sm font-semibold text-rose-700">{saveError}</p>}
        <Button type="button" variant="secondary" onClick={() => void save("draft")} disabled={saving || !draftState.data}>임시저장</Button>
        {step === "attendance" ? (
          <Button type="button" onClick={() => setStep("details")} disabled={!draftState.data}>나눔 작성으로</Button>
        ) : (
          <Button type="button" onClick={() => void save("submitted")} disabled={saving || !draftState.data}>{saving ? "저장 중" : "확인 후 제출"}</Button>
        )}
      </div>
    </form>
  );
}
