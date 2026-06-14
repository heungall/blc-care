"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";

export default function AdminBackupPage() {
  const { user } = useAuth();
  const state = useApiData(() => api.getBackupHistory(user), [user.email]);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async (format: "CSV" | "XLSX") => {
    setCreating(true);
    setMessage("");
    try {
      await api.createBackup(user, format);
      await state.reload();
      setMessage(`${format} 백업을 Google Drive에 생성했습니다.`);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  return <AdminGuard>
    <PageHeader title="백업 및 내보내기" description="Google Sheets 데이터를 지정된 Google Drive 폴더에 백업합니다." />
    {state.loading && <LoadingState />}
    {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
    <Card>
      <h2 className="text-lg font-bold">새 백업 생성</h2>
      <p className="mt-2 text-sm text-slate-500">CSV는 전체 Sheet를 ZIP으로, XLSX는 통합 문서 파일로 생성합니다.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button type="button" variant="secondary" disabled={creating} onClick={() => void create("CSV")}>CSV ZIP 생성</Button><Button type="button" disabled={creating} onClick={() => void create("XLSX")}>XLSX 생성</Button></div>
      {message && <p className="mt-4 text-sm font-semibold text-slate-700">{message}</p>}
    </Card>
    {state.data && <Card className="mt-5">
      <h2 className="text-lg font-bold">최근 백업 이력</h2>
      {state.data.length ? <div className="mt-4 space-y-3">{state.data.map((item) => <div key={item.backup_id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.format} 백업</p><p className="mt-1 text-xs text-slate-500">{item.created_at} · {item.created_by}</p></div><div className="flex items-center gap-2"><Badge tone="success">완료</Badge>{item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700">Drive에서 열기</a>}</div></div>)}</div> : <div className="mt-4"><EmptyState>생성된 백업이 없습니다.</EmptyState></div>}
    </Card>}
  </AdminGuard>;
}
