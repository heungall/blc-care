"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { ReportListSkeleton } from "@/components/skeletons";
import { ReportStatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, LinkButton, Select } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, type ReportListItem } from "@/lib/api";

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

  const weekGroups = new Map<string, ReportListItem[]>();
  for (const report of reports) {
    const key = `${report.week_start_date} ~ ${report.week_end_date}`;
    if (!weekGroups.has(key)) weekGroups.set(key, []);
    weekGroups.get(key)!.push(report);
  }

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
      {!loading && !error && (
        reports.length ? (
          <div className="space-y-6">
            {[...weekGroups.entries()].map(([weekLabel, weekReports]) => (
              <section key={weekLabel}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-sm font-bold text-slate-700">{weekLabel}</h2>
                  <span className="text-xs text-slate-400">{weekReports.length}개 셀</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {weekReports.map((report) => (
                    <div key={report.report_id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
                      <div className={`size-2 rounded-full ${statusDot(report.status)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{report.cell_name}</span>
                          <ReportStatusBadge status={report.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">작성자 {report.leader_name} · {report.record_count}명 기록 · 수정 {fmtDate(report.updated_at)}</p>
                      </div>
                      <LinkButton href={`/reports/${report.report_id}`} variant="secondary">상세</LinkButton>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : <EmptyState>표시할 리포트가 없습니다.</EmptyState>
      )}
    </>
  );
}

function statusDot(status: string): string {
  switch (status) {
    case "submitted": return "bg-green-400";
    case "locked": return "bg-blue-400";
    case "draft": return "bg-amber-400";
    default: return "bg-slate-300";
  }
}

function fmtDate(value: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}
