"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { ReportStatusBadge } from "@/components/status-badge";
import { Badge, Button, Card, EmptyState, ErrorState, LinkButton, LoadingState, Select, Textarea } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AttendanceStatus, WeeklyMemberRecord } from "@/lib/types";

type ReportMemberRecord = WeeklyMemberRecord & { member_display_name: string };

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const state = useApiData(() => api.getReportDetail(user, params.id), [user.email, params.id]);
  const [summary, setSummary] = useState("");
  const [records, setRecords] = useState<ReportMemberRecord[]>([]);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.data) {
      setSummary(state.data.report.overall_summary ?? "");
      setRecords(state.data.records);
    }
  }, [state.data]);

  if (state.loading) return <><PageHeader title="리포트 상세" /><LoadingState /></>;
  if (state.error) return <><PageHeader title="리포트 상세" /><ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState></>;
  if (!state.data) return <><PageHeader title="리포트 상세" /><EmptyState>조회할 수 있는 리포트가 없습니다.</EmptyState></>;

  const { report, can_edit: editable } = state.data;
  const updateRecord = (memberId: string, patch: Partial<WeeklyMemberRecord>) => {
    setRecords((items) => items.map((record) => record.member_id === memberId ? { ...record, ...patch } : record));
  };
  const save = async () => {
    setSaving(true);
    setMessage("");
    setSaveError("");
    try {
      await api.saveWeeklyReport(user, {
        report_id: report.report_id,
        cell_id: report.cell_id,
        week_start_date: report.week_start_date,
        report_date: report.report_date,
        overall_summary: summary,
        status: report.status === "submitted" ? "submitted" : "draft",
        records,
      });
      setMessage("변경 내용을 저장했습니다.");
      void state.reload();
    } catch (error) {
      setSaveError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title={`${report.cell_name} 리포트`} description={`${report.week_start_date} ~ ${report.week_end_date} · 작성자 ${report.leader_name}`} action={<LinkButton href="/reports" variant="secondary">목록으로</LinkButton>} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><ReportStatusBadge status={report.status} /><Badge tone={editable ? "primary" : "neutral"}>{editable ? "수정 가능" : "읽기 전용"}</Badge></div>
          <p className="text-xs text-slate-400">마지막 수정 {report.updated_at}</p>
        </div>
        {!editable && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">수정 가능 기간이 지났거나 잠긴 리포트입니다.</p>}
        <label className="mt-5 block text-sm font-semibold">전체 나눔 요약<Textarea className="mt-2 min-h-24" value={summary} onChange={(event) => setSummary(event.target.value)} disabled={!editable} /></label>
      </Card>
      <section className="mt-5">
        <h2 className="text-lg font-bold">인원별 기록</h2>
        <div className="mt-4 space-y-4">
          {records.length ? records.map((record) => (
            <Card key={record.record_id || record.member_id}>
              <h3 className="font-bold">{record.member_display_name}</h3>
              <label className="mt-4 block text-sm font-semibold">출석 상태<Select className="mt-2" value={record.attendance_status} disabled={!editable} onChange={(event) => updateRecord(record.member_id, { attendance_status: event.target.value as AttendanceStatus })}><option value="unknown">미확인</option><option value="present">출석</option><option value="absent">결석</option><option value="excused">사유 결석</option></Select></label>
              <label className="mt-4 block text-sm font-semibold">개인 나눔 요약<Textarea className="mt-2 min-h-20" value={record.sharing_summary ?? ""} disabled={!editable} onChange={(event) => updateRecord(record.member_id, { sharing_summary: event.target.value })} /></label>
              <label className="mt-4 block text-sm font-semibold">기도제목<Textarea className="mt-2 min-h-20" value={record.prayer_request ?? ""} disabled={!editable} onChange={(event) => updateRecord(record.member_id, { prayer_request: event.target.value })} /></label>
              <label className="mt-4 block text-sm font-semibold">지원 제안<Textarea className="mt-2 min-h-20" value={record.support_suggestion ?? ""} disabled={!editable} onChange={(event) => updateRecord(record.member_id, { support_suggestion: event.target.value })} /></label>
            </Card>
          )) : <EmptyState>기록된 인원이 없습니다.</EmptyState>}
        </div>
      </section>
      {editable && <div className="sticky bottom-16 mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg sm:flex-row sm:justify-end lg:bottom-4">{message && <p className="mr-auto self-center text-sm font-semibold text-green-700">{message}</p>}{saveError && <p className="mr-auto self-center text-sm font-semibold text-rose-700">{saveError}</p>}<Button type="button" onClick={() => void save()} disabled={saving}>{saving ? "저장 중" : "변경 내용 저장"}</Button></div>}
    </>
  );
}
