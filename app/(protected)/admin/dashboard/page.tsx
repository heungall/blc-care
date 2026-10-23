"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { AdminDashboardSkeleton } from "@/components/skeletons";
import { Badge, Card, ErrorState, LinkButton } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const state = useApiData(async () => {
    const [members, reports, newcomers, cells] = await Promise.all([
      api.getMembers(user),
      api.getReports(user),
      api.getNewcomers(user),
      api.getCells(user),
    ]);
    return { members, reports, newcomers, cells };
  }, [user.email]);
  const data = state.data;
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  const toggleCell = (cellId: string) => {
    setExpandedCells((current) => {
      const next = new Set(current);
      if (next.has(cellId)) next.delete(cellId);
      else next.add(cellId);
      return next;
    });
  };

  return (
    <AdminGuard>
      <PageHeader title="Admin 대시보드" description="전체 돌봄 현황과 필요한 관리 항목을 확인하세요." action={<LinkButton href="/dashboard" variant="secondary">셀리더 화면</LinkButton>} />
      {state.loading && <AdminDashboardSkeleton />}
      {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="전체 성도" value={`${data.members.length}명`} href="/members" />
            <Metric label="활동 성도" value={`${data.members.filter((member) => member.status === "active").length}명`} href="/members" tone="success" />
            <Metric label="신규 새신자" value={`${data.newcomers.filter((item) => item.status === "new").length}명`} href="/admin/newcomers" tone="primary" />
            <Metric label="제출 리포트" value={`${data.reports.filter((report) => report.status === "submitted").length}건`} href="/reports" tone="warning" />
          </div>
          <Card className="mt-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">셀별 인원</h2><Badge tone="neutral">전체 {data.cells.length}개 셀</Badge></div>
            <div className="mt-4 divide-y divide-slate-100">
              {data.cells.map((cell) => {
                const cellMembers = data.members.filter((member) => member.current_cell_id === cell.cell_id);
                const expanded = expandedCells.has(cell.cell_id);
                return (
                  <div key={cell.cell_id}>
                    <button
                      type="button"
                      className="focus-ring flex w-full items-center justify-between rounded-xl px-4 py-3 transition hover:bg-slate-50"
                      onClick={() => toggleCell(cell.cell_id)}
                    >
                      <span className="font-semibold">{cell.cell_name}</span>
                      <span className="text-sm text-slate-500">{cellMembers.length}명 {expanded ? "▲" : "▼"}</span>
                    </button>
                    {expanded && (
                      <div className="mb-3 ml-4 mr-4 rounded-lg border border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                        {cellMembers.length ? cellMembers.map((member) => (
                          <Link
                            key={member.member_id}
                            href={`/members/${member.member_id}`}
                            className="focus-ring flex items-center justify-between px-4 py-2.5 text-sm transition hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <span className="font-semibold text-slate-700">{member.display_name}</span>
                            <span className="text-xs text-slate-400">{member.last_attendance_date ? `최근 ${member.last_attendance_date}` : "출석 기록 없음"}</span>
                          </Link>
                        )) : (
                          <p className="px-4 py-4 text-center text-sm text-slate-400">소속 셀원이 없습니다.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </AdminGuard>
  );
}

function Metric({ label, value, href, tone = "neutral" }: { label: string; value: string; href: string; tone?: "neutral" | "primary" | "success" | "warning" }) {
  return <Card variant="summary"><Badge tone={tone}>{label}</Badge><p className="mt-4 text-3xl font-bold">{value}</p><LinkButton href={href} variant="secondary" className="mt-5 w-full">상세 보기</LinkButton></Card>;
}
