"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { ReportListSkeleton } from "@/components/skeletons";
import { ReportStatusBadge } from "@/components/status-badge";
import { Card, EmptyState, ErrorState, LinkButton, Select } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const { user, leaderMode } = useAuth();
  const [cellId, setCellId] = useState("all");
  const scope = leaderMode ? "leader" : "admin";
  const cellsState = useApiData(() => api.getCells(user, { scope }), [user.email, leaderMode]);
  const state = useApiData(() => api.getReports(user, {
    scope,
    cell_id: cellId === "all" ? undefined : cellId,
  }), [user.email, leaderMode, cellId]);
  const cells = cellsState.data ?? [];
  const reports = state.data ?? [];
  const loading = cellsState.loading || state.loading;
  const error = cellsState.error || state.error;

  return (
    <>
      <PageHeader title="주차별 리포트" description={leaderMode ? "셀리더 모드에서는 배정된 셀 리포트만 표시합니다." : "작성한 셀 리포트를 주차별로 확인하세요."} action={<LinkButton href="/reports/new">새 리포트 작성</LinkButton>} />
      <div className="mb-5">
        <Select value={cellId} onChange={(event) => setCellId(event.target.value)} aria-label="셀 필터" className="max-w-xs">
          <option value="all">전체 셀</option>
          {cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}
        </Select>
      </div>
      {loading && <ReportListSkeleton />}
      {error && <ErrorState onRetry={() => { void cellsState.reload(); void state.reload(); }}>{error}</ErrorState>}
      {!loading && !error && (reports.length ? <div className="space-y-4">{reports.map((report) => <Card key={report.report_id} variant="list" padding="compact" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{report.cell_name}</h2><ReportStatusBadge status={report.status} /></div><p className="mt-2 text-sm text-slate-500">{report.week_start_date} ~ {report.week_end_date} · 작성자 {report.leader_name}</p><p className="mt-1 text-xs text-slate-400">수정 {report.updated_at}</p></div><LinkButton href={`/reports/${report.report_id}`} variant="secondary">상세 보기</LinkButton></Card>)}</div> : <EmptyState>표시할 리포트가 없습니다.</EmptyState>)}
    </>
  );
}
