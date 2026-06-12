"use client";

import { useEffect, useMemo, useState } from "react";
import { MemberContentBulkInput } from "@/components/member-content-bulk-input";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, EmptyState, ErrorState, Input, LoadingState, Select, Textarea } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import { getTodayInTimeZone, getWeekRange } from "@/lib/date";
import type { AttendanceStatus, WeeklyMemberRecord } from "@/lib/types";

export function ReportForm() {
  const { user } = useAuth();
  const cellsState = useApiData(() => api.getCells(user), [user.email]);
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
  const week = getWeekRange(getTodayInTimeZone());
  const draftState = useApiData(
    () => cellId ? api.getWeeklyReportDraft(user, cellId, week.week_start_date) : Promise.resolve(null),
    [user.email, cellId, week.week_start_date],
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
      });
      setMessage(status === "draft" ? "임시저장했습니다." : "리포트를 제출했습니다.");
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

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <Card>
        <h2 className="text-lg font-bold">리포트 기본 정보</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">셀<Select className="mt-2" value={cellId} onChange={(event) => changeCell(event.target.value)}>{cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select></label>
          <label className="text-sm font-semibold">주차<Input className="mt-2" value={`${week.week_start_date} ~ ${week.week_end_date}`} readOnly /></label>
          <label className="text-sm font-semibold">모임일<Input className="mt-2" type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} /></label>
        </div>
        <label className="mt-4 block text-sm font-semibold">전체 나눔 요약<Textarea className="mt-2 min-h-24" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="민감한 내용을 과하게 자세히 적지 않도록 확인해주세요." /></label>
      </Card>

      {draftState.loading && <LoadingState>리포트 초안을 불러오는 중입니다.</LoadingState>}
      {draftState.error && <ErrorState onRetry={() => void draftState.reload()}>{draftState.error}</ErrorState>}
      {!draftState.loading && !draftState.error && draftState.data && (
        <>
          <MemberContentBulkInput members={members} contentLabel="나눔" placeholder={"하늘자매: 샘플 나눔 내용 A\n푸름/ 샘플 나눔 내용 B"} onConfirm={(contents) => applyContents("sharing", contents)} />
          <MemberContentBulkInput members={members} contentLabel="기도제목" placeholder={"하늘자매: 샘플 기도 내용 A\n푸름/ 샘플 기도 내용 B"} onConfirm={(contents) => applyContents("prayer", contents)} />
          <section>
            <h2 className="text-lg font-bold">인원별 기록</h2>
            <div className="mt-4 space-y-4">
              {members.map((member) => {
                const record = records.find((item) => item.member_id === member.member_id);
                return (
                  <Card key={member.member_id}>
                    <h3 className="font-bold">{member.display_name}</h3>
                    <label className="mt-4 block text-sm font-semibold">출석 상태<Select className="mt-2" value={record?.attendance_status ?? "unknown"} onChange={(event) => updateRecord(member.member_id, { attendance_status: event.target.value as AttendanceStatus })}><option value="unknown">미확인</option><option value="present">출석</option><option value="absent">결석</option><option value="excused">사유 결석</option></Select></label>
                    <label className="mt-4 block text-sm font-semibold">개인 나눔 요약<Textarea className="mt-2 min-h-20" value={sharings[member.member_id] ?? record?.sharing_summary ?? ""} onChange={(event) => { setSharings((current) => ({ ...current, [member.member_id]: event.target.value })); updateRecord(member.member_id, { sharing_summary: event.target.value }); }} /></label>
                    <label className="mt-4 block text-sm font-semibold">기도제목<Textarea className="mt-2 min-h-20" value={prayers[member.member_id] ?? record?.prayer_request ?? ""} onChange={(event) => { setPrayers((current) => ({ ...current, [member.member_id]: event.target.value })); updateRecord(member.member_id, { prayer_request: event.target.value }); }} /></label>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}
      <div className="sticky bottom-16 z-10 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end lg:bottom-4">
        {message && <p className="mr-auto self-center text-sm font-semibold text-green-700">{message}</p>}
        {saveError && <p className="mr-auto self-center text-sm font-semibold text-rose-700">{saveError}</p>}
        <Button type="button" variant="secondary" onClick={() => void save("draft")} disabled={saving || !draftState.data}>임시저장</Button>
        <Button type="button" onClick={() => void save("submitted")} disabled={saving || !draftState.data}>{saving ? "저장 중" : "확인 후 제출"}</Button>
      </div>
    </form>
  );
}
