"use client";

import { useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { AbsenceStatusBadge } from "@/components/status-badge";
import { Badge, Button, Card, EmptyState, LinkButton, Select, Textarea } from "@/components/ui";
import { mockApi as api } from "@/lib/api";
import { mockAbsenceAlerts } from "@/lib/mock-data";
import type { AbsenceAlert, AbsenceAlertStatus } from "@/lib/types";

export default function AdminAbsencePage() {
  const { user } = useAuth();
  const members = api.getMembers(user);
  const cells = api.getCells(user);
  const [alerts, setAlerts] = useState<AbsenceAlert[]>(mockAbsenceAlerts);
  const [statusFilter, setStatusFilter] = useState<AbsenceAlertStatus | "all">("all");
  const [cellFilter, setCellFilter] = useState("all");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const filtered = useMemo(
    () => alerts.filter((alert) =>
      (statusFilter === "all" || alert.status === statusFilter)
      && (cellFilter === "all" || alert.cell_id === cellFilter)),
    [alerts, cellFilter, statusFilter],
  );

  const updateAlert = (alertId: string, patch: Partial<AbsenceAlert>) => {
    setAlerts((items) => items.map((item) => item.alert_id === alertId ? { ...item, ...patch } : item));
  };

  const saveAction = (alert: AbsenceAlert, status: AbsenceAlertStatus) => {
    const result = api.updateAbsenceAlert(alert.alert_id, status, alert.memo ?? "");
    updateAlert(alert.alert_id, { status });
    setMessages((current) => ({ ...current, [alert.alert_id]: result.message }));
  };

  return (
    <AdminGuard>
      <PageHeader title="장기결석자 관리" description="기본 기준은 3개월이며, Phase 1에서는 샘플 알림을 표시합니다." />
      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AbsenceAlertStatus | "all")}><option value="all">전체 상태</option><option value="open">미확인</option><option value="checked">확인 완료</option><option value="resolved">해결 완료</option></Select>
        <Select value={cellFilter} onChange={(event) => setCellFilter(event.target.value)}><option value="all">전체 셀</option>{cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select>
      </div>
      {filtered.length ? (
        <div className="space-y-4">
          {filtered.map((alert) => {
            const member = members.find((item) => item.member_id === alert.member_id);
            return (
              <Card key={alert.alert_id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{member?.display_name ?? "알 수 없음"}</h2><AbsenceStatusBadge status={alert.status} /><Badge tone="warning">{alert.absence_months}개월</Badge></div>
                    <p className="mt-2 text-sm text-slate-500">{api.cellName(alert.cell_id)} · 마지막 출석 {alert.last_attended_date}</p>
                  </div>
                  {member && <LinkButton href={`/members/${member.member_id}`} variant="secondary">성도 상세</LinkButton>}
                </div>
                <label className="mt-4 block text-sm font-semibold">조치 메모<Textarea className="mt-2 min-h-20" value={alert.memo ?? ""} onChange={(event) => updateAlert(alert.alert_id, { memo: event.target.value })} /></label>
                {messages[alert.alert_id] && <p className="mt-3 text-sm font-semibold text-green-700">{messages[alert.alert_id]}</p>}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => saveAction(alert, "checked")}>확인 처리</Button>
                  <Button type="button" onClick={() => saveAction(alert, "resolved")}>해결 처리</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState>조건에 맞는 장기결석 알림이 없습니다.</EmptyState>}
    </AdminGuard>
  );
}
