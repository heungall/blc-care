"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card } from "@/components/ui";
import { mockApi as api } from "@/lib/api";
import type { BackupHistory } from "@/lib/types";

export default function AdminBackupPage() {
  const [history, setHistory] = useState<BackupHistory[]>(api.getBackupHistory());
  const [message, setMessage] = useState("");

  const create = (format: "CSV" | "XLSX") => {
    const result = api.createBackup(format);
    setHistory((items) => [{ backup_id: `backup_mock_${Date.now()}`, format, created_at: "2026-06-12 12:00:00", created_by: "user_admin", status: "mock" }, ...items]);
    setMessage(result.message);
  };

  return (
    <AdminGuard>
      <PageHeader title="백업 및 내보내기" description="실제 Google Sheets·Drive 연결 없이 mock 백업 흐름만 확인합니다." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">저장 위치</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">Google Sheets DB</p><p className="mt-1 text-sm text-slate-500">Phase 3 이후 실제 링크 연결 예정</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">Google Drive 백업 폴더</p><p className="mt-1 text-sm text-slate-500">Phase 3 이후 실제 링크 연결 예정</p></div>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">새 백업 생성</h2>
          <p className="mt-2 text-sm text-slate-500">버튼은 파일을 생성하거나 외부 서비스에 연결하지 않습니다.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button type="button" variant="secondary" onClick={() => create("CSV")}>CSV mock 내보내기</Button><Button type="button" onClick={() => create("XLSX")}>XLSX mock 백업</Button></div>
          {message && <p className="mt-4 text-sm font-semibold text-green-700">{message}</p>}
        </Card>
      </div>
      <Card className="mt-5">
        <h2 className="text-lg font-bold">최근 백업 이력</h2>
        <div className="mt-4 space-y-3">{history.map((item) => <div key={item.backup_id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.format} 백업</p><p className="mt-1 text-xs text-slate-500">{item.created_at} · {api.userName(item.created_by)}</p></div><Badge tone="neutral">mock</Badge></div>)}</div>
      </Card>
    </AdminGuard>
  );
}
