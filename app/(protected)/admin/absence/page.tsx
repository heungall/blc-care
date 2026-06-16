"use client";

import { useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { AbsenceStatusBadge } from "@/components/status-badge";
import { Badge, Button, Card, EmptyState, ErrorState, LinkButton, LoadingState, Select, Textarea } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AbsenceAlert, AbsenceAlertStatus } from "@/lib/types";

export default function AdminAbsencePage() {
  const { user } = useAuth();
  const state = useApiData(async () => {
    const [alerts, members, cells] = await Promise.all([api.getAbsenceAlerts(user), api.getMembers(user), api.getCells(user)]);
    return { alerts, members, cells };
  }, [user.email]);
  const [statusFilter, setStatusFilter] = useState<AbsenceAlertStatus | "all">("all");
  const [cellFilter, setCellFilter] = useState("all");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const filtered = useMemo(() => (state.data?.alerts ?? []).filter((alert) =>
    (statusFilter === "all" || alert.status === statusFilter) &&
    (cellFilter === "all" || alert.cell_id === cellFilter)
  ), [state.data, cellFilter, statusFilter]);

  const updateAlert = (alertId: string, patch: Partial<AbsenceAlert>) => {
    state.setData((current) => current ? { ...current, alerts: current.alerts.map((item) => item.alert_id === alertId ? { ...item, ...patch } : item) } : current);
  };

  const saveAction = async (alert: AbsenceAlert, status: AbsenceAlertStatus) => {
    try {
      const updated = await api.updateAbsenceAlert(user, alert.alert_id, status, alert.memo ?? "");
      updateAlert(alert.alert_id, updated);
      setMessages((current) => ({ ...current, [alert.alert_id]: "장기결석 조치 상태를 저장했습니다." }));
    } catch (error) {
      setMessages((current) => ({ ...current, [alert.alert_id]: getApiErrorMessage(error) }));
    }
  };

  return <AdminGuard>
    <PageHeader title="장기결석자 관리" description="장기결석 알림을 확인하고 돌봄 조치 상태를 관리하세요." />
    {state.loading && <LoadingState />}
    {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
    {state.data && <>
      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AbsenceAlertStatus | "all")}><option value="all">전체 상태</option><option value="open">미확인</option><option value="checked">확인 완료</option><option value="resolved">해결 완료</option></Select>
        <Select value={cellFilter} onChange={(event) => setCellFilter(event.target.value)}><option value="all">전체 셀</option>{state.data.cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select>
      </div>
      {filtered.length ? <div className="space-y-4">{filtered.map((alert) => {
        const member = state.data?.members.find((item) => item.member_id === alert.member_id);
        const cellName = state.data?.cells.find((item) => item.cell_id === alert.cell_id)?.cell_name ?? "미지정 셀";
        return <Card key={alert.alert_id}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{member?.display_name ?? "알 수 없음"}</h2><AbsenceStatusBadge status={alert.status} /><Badge tone="warning">{alert.absence_months ?? 0}개월</Badge></div><p className="mt-2 text-sm text-slate-500">{cellName} · 마지막 출석 {alert.last_attended_date || "기록 없음"}</p></div>{member && <LinkButton href={`/members/${member.member_id}`} variant="secondary">성도 상세</LinkButton>}</div>
          <label className="mt-4 block text-sm font-semibold">조치 메모<Textarea className="mt-2 min-h-20" value={alert.memo ?? ""} onChange={(event) => updateAlert(alert.alert_id, { memo: event.target.value })} /></label>
          {messages[alert.alert_id] && <p className="mt-3 text-sm font-semibold text-slate-700">{messages[alert.alert_id]}</p>}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => void saveAction(alert, "checked")}>확인 처리</Button><Button type="button" onClick={() => void saveAction(alert, "resolved")}>해결 처리</Button></div>
        </Card>;
      })}</div> : <EmptyState>조건에 맞는 장기결석 알림이 없습니다.</EmptyState>}
    </>}
  </AdminGuard>;
}
