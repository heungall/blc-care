"use client";

import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";

export default function AdminBackupPage() {
  const { user } = useAuth();
  const state = useApiData(() => api.getBackupHistory(user), [user.email]);
  return <AdminGuard>
    <PageHeader title="백업 및 내보내기" description="운영 백업은 Supabase Dashboard에서 관리합니다." />
    {state.loading && <LoadingState />}
    {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
    <Card>
      <h2 className="text-lg font-bold">새 백업 생성</h2>
      <p className="mt-2 text-sm text-slate-500">현재 앱 내 수동 백업 생성은 지원하지 않습니다. Supabase Dashboard의 백업 기능을 사용해주세요.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button type="button" variant="secondary" disabled>CSV 내보내기 준비 중</Button><Button type="button" disabled>XLSX 내보내기 준비 중</Button></div>
    </Card>
    {state.data && <Card className="mt-5">
      <h2 className="text-lg font-bold">최근 백업 이력</h2>
      {state.data.length ? <div className="mt-4 space-y-3">{state.data.map((item) => <div key={item.backup_id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.format} 백업</p><p className="mt-1 text-xs text-slate-500">{item.created_at} · {item.created_by}</p></div><Badge tone="success">완료</Badge></div>)}</div> : <div className="mt-4"><EmptyState>앱에서 생성된 백업 이력이 없습니다.</EmptyState></div>}
    </Card>}
  </AdminGuard>;
}
