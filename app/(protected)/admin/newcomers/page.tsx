"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { NewcomerStatusBadge } from "@/components/status-badge";
import { Button, Card, EmptyState, ErrorState, Input, LoadingState, Select, Textarea } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import type { Newcomer, NewcomerStatus } from "@/lib/types";

export default function AdminNewcomersPage() {
  const { user } = useAuth();
  const newcomersState = useApiData(() => api.getNewcomers(user), [user.email]);
  const cellsState = useApiData(() => api.getCells(user), [user.email]);
  const [newcomers, setNewcomers] = useState<Newcomer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewcomerStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [conversionCellId, setConversionCellId] = useState("");

  useEffect(() => {
    if (newcomersState.data) {
      setNewcomers(newcomersState.data);
      setSelectedId((current) => current || newcomersState.data?.[0]?.newcomer_id || "");
    }
  }, [newcomersState.data]);
  useEffect(() => {
    if (!conversionCellId && cellsState.data?.[0]) setConversionCellId(cellsState.data[0].cell_id);
  }, [cellsState.data, conversionCellId]);

  const filtered = useMemo(() => newcomers.filter((item) =>
    (statusFilter === "all" || item.status === statusFilter)
    && (item.name.includes(query.trim()) || item.phone.includes(query.trim()))), [newcomers, query, statusFilter]);
  const selected = newcomers.find((item) => item.newcomer_id === selectedId);
  const updateSelected = (patch: Partial<Newcomer>) => {
    if (selected) setNewcomers((items) => items.map((item) => item.newcomer_id === selected.newcomer_id ? { ...item, ...patch } : item));
  };
  const runAction = async (action: () => Promise<Newcomer>, successMessage: string) => {
    setSaving(true);
    setMessage("");
    setActionError("");
    try {
      const updated = await action();
      setNewcomers((items) => items.map((item) => item.newcomer_id === updated.newcomer_id ? updated : item));
      setMessage(successMessage);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <PageHeader title="새신자 관리" description="등록 정보는 허가된 Admin만 확인할 수 있습니다." />
      {(newcomersState.loading || cellsState.loading) && <LoadingState />}
      {(newcomersState.error || cellsState.error) && <ErrorState onRetry={() => { void newcomersState.reload(); void cellsState.reload(); }}>{newcomersState.error || cellsState.error}</ErrorState>}
      {!newcomersState.loading && !cellsState.loading && !newcomersState.error && !cellsState.error && (
        <>
          <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="샘플 이름 또는 연락처 검색" />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as NewcomerStatus | "all")}><option value="all">전체 상태</option><option value="new">신규</option><option value="contacted">연락 완료</option><option value="converted">성도 전환 완료</option><option value="archived">보관</option></Select>
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.2fr]">
            <div className="space-y-3">{filtered.length ? filtered.map((item) => <button key={item.newcomer_id} type="button" onClick={() => { setSelectedId(item.newcomer_id); setMessage(""); setActionError(""); }} className={`focus-ring w-full rounded-2xl border bg-white p-4 text-left shadow-sm ${selectedId === item.newcomer_id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="flex items-center justify-between gap-3"><span className="font-bold">{item.name}</span><NewcomerStatusBadge status={item.status} /></div><p className="mt-2 text-sm text-slate-500">{item.visit_channel || "방문 경로 미입력"} · {item.submitted_at.slice(0, 10)}</p></button>) : <EmptyState>표시할 새신자 정보가 없습니다.</EmptyState>}</div>
            {selected ? (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{selected.name}</h2><NewcomerStatusBadge status={selected.status} /></div>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><Detail label="휴대폰 번호" value={selected.phone} /><Detail label="주소" value={selected.address} /><Detail label="방문 경로" value={selected.visit_channel} /><Detail label="예배 이후 일정" value={selected.after_service_plan} /><Detail label="방문 동기" value={selected.visit_motivation} /><Detail label="신앙생활 경험" value={selected.faith_experience} /></dl>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">상태<Select className="mt-2" value={selected.status} disabled={selected.status === "converted"} onChange={(event) => updateSelected({ status: event.target.value as NewcomerStatus })}><option value="new">신규</option><option value="contacted">연락 완료</option><option value="archived">보관</option>{selected.status === "converted" && <option value="converted">성도 전환 완료</option>}</Select></label>
                  <label className="text-sm font-semibold">전환 셀<Select className="mt-2" value={conversionCellId} onChange={(event) => setConversionCellId(event.target.value)}>{(cellsState.data ?? []).map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select></label>
                </div>
                <label className="mt-4 block text-sm font-semibold">Admin 메모<Textarea className="mt-2 min-h-24" value={selected.admin_memo ?? ""} onChange={(event) => updateSelected({ admin_memo: event.target.value })} /></label>
                {message && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</p>}
                {actionError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{actionError}</p>}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" disabled={saving || selected.status === "converted"} onClick={() => void runAction(() => api.updateNewcomer(user, selected.newcomer_id, selected.status, selected.admin_memo ?? ""), "상태와 메모를 저장했습니다.")}>상태와 메모 저장</Button>
                  <Button type="button" disabled={saving || selected.status === "converted" || !conversionCellId} onClick={() => void runAction(async () => (await api.convertNewcomer(user, selected.newcomer_id, conversionCellId)).newcomer, "성도 전환을 완료했습니다.")}>성도 DB 전환</Button>
                </div>
              </Card>
            ) : <EmptyState>목록에서 새신자를 선택해주세요.</EmptyState>}
          </div>
        </>
      )}
    </AdminGuard>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold text-slate-400">{label}</dt><dd className="mt-1 text-slate-700">{value || "입력 없음"}</dd></div>;
}
