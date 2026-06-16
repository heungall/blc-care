"use client";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { ReportStatusBadge } from "@/components/status-badge";
import { Badge, Card, ErrorState, LinkButton, LoadingState } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { hasRole } from "@/lib/permissions";

export default function DashboardPage() {
  const { user, leaderMode } = useAuth();
  const state = useApiData(async () => {
    const [cells, members, reports] = await Promise.all([api.getCells(user), api.getMembers(user), api.getReports(user)]);
    return { cells, members, reports };
  }, [user.email, leaderMode]);

  if (state.loading) return <><PageHeader title="돌봄 현황" /><LoadingState /></>;
  if (state.error) return <><PageHeader title="돌봄 현황" /><ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState></>;
  const { cells = [], members = [], reports = [] } = state.data ?? {};
  const unresolved = members.reduce((sum, member) => sum + member.unresolved_note_count, 0);

  return (
    <>
      <PageHeader title={leaderMode ? "담당 셀 대시보드" : "돌봄 현황"} description={`${user.name}님의 돌봄 현황을 확인하세요.`} action={<LinkButton href="/reports/new">이번 주 리포트 작성</LinkButton>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={leaderMode ? "담당 셀" : "조회 가능한 셀"} value={`${cells.length}개`} />
        <SummaryCard label="조회 가능한 성도" value={`${members.length}명`} />
        <SummaryCard label="최근 리포트" value={`${reports.length}건`} />
        <SummaryCard label="미해결 돌봄 메모" value={`${unresolved}건`} tone={unresolved ? "warning" : "neutral"} />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">최근 리포트</h2><LinkButton href="/reports" variant="secondary">목록 보기</LinkButton></div>
          <div className="mt-4 space-y-3">{reports.slice(0, 5).map((report) => <div key={report.report_id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{report.cell_name}</p><p className="mt-1 text-xs text-slate-500">{report.week_start_date} 주차</p></div><ReportStatusBadge status={report.status} /></div>)}</div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">현재 권한</h2>
          <div className="mt-4 flex flex-wrap gap-2">{user.roles.map((role) => <Badge key={role} tone="primary">{role}</Badge>)}</div>
          <p className="mt-4 text-sm leading-6 text-slate-500">{hasRole(user, "admin") && hasRole(user, "cell_leader") ? "겸임 사용자는 Admin과 셀리더 화면을 전환할 수 있습니다." : "서버가 현재 역할과 셀 배정을 기준으로 조회 범위를 제한합니다."}</p>
        </Card>
      </div>
    </>
  );
}

function SummaryCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "warning" }) {
  return <Card><Badge tone={tone}>{label}</Badge><p className="mt-4 text-3xl font-bold">{value}</p></Card>;
}
