"use client";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { ReportStatusBadge } from "@/components/status-badge";
import { Card, EmptyState, ErrorState, LinkButton, LoadingState } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const { user, leaderMode } = useAuth();
  const state = useApiData(() => api.getReports(user), [user.email, leaderMode]);
  const reports = state.data ?? [];
  return (
    <>
      <PageHeader title="주차별 리포트" description="작성한 셀 리포트를 주차별로 확인하세요." action={<LinkButton href="/reports/new">새 리포트 작성</LinkButton>} />
      {state.loading && <LoadingState />}
      {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
      {!state.loading && !state.error && (reports.length ? <div className="space-y-4">{reports.map((report) => <Card key={report.report_id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{report.cell_name}</h2><ReportStatusBadge status={report.status} /></div><p className="mt-2 text-sm text-slate-500">{report.week_start_date} ~ {report.week_end_date} · 작성자 {report.leader_name}</p><p className="mt-1 text-xs text-slate-400">수정 {report.updated_at}</p></div><LinkButton href={`/reports/${report.report_id}`} variant="secondary">상세 보기</LinkButton></Card>)}</div> : <EmptyState>표시할 리포트가 없습니다.</EmptyState>)}
    </>
  );
}
