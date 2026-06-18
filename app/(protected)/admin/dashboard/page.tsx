"use client";

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
            <div className="mt-4 space-y-3">{data.cells.map((cell) => <div key={cell.cell_id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="font-semibold">{cell.cell_name}</span><span className="text-sm text-slate-500">{data.members.filter((member) => member.current_cell_id === cell.cell_id).length}명</span></div>)}</div>
          </Card>
        </>
      )}
    </AdminGuard>
  );
}

function Metric({ label, value, href, tone = "neutral" }: { label: string; value: string; href: string; tone?: "neutral" | "primary" | "success" | "warning" }) {
  return <Card variant="summary"><Badge tone={tone}>{label}</Badge><p className="mt-4 text-3xl font-bold">{value}</p><LinkButton href={href} variant="secondary" className="mt-5 w-full">상세 보기</LinkButton></Card>;
}
