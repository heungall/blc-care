"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Input, Select } from "@/components/ui";
import { mockApi as api } from "@/lib/api";
import type { AppSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(api.getSettings());
  const [message, setMessage] = useState("");
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <AdminGuard>
      <PageHeader title="시스템 설정" description="Phase 1에서는 설정 변경 결과만 mock으로 표시합니다." />
      <Card className="max-w-3xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">교회명<Input className="mt-2" value={settings.church_name} onChange={(event) => update("church_name", event.target.value)} /></label>
          <label className="text-sm font-semibold">앱 이름<Input className="mt-2" value={settings.app_name} onChange={(event) => update("app_name", event.target.value)} /></label>
          <label className="text-sm font-semibold">장기결석 기준 개월 수<Input className="mt-2" type="number" min="1" value={settings.long_absence_months} onChange={(event) => update("long_absence_months", Number(event.target.value))} /></label>
          <label className="text-sm font-semibold">리포트 수정 마감 요일<Select className="mt-2" value={settings.report_edit_deadline_day} onChange={(event) => update("report_edit_deadline_day", event.target.value)}><option value="Sunday">Sunday</option><option value="Monday">Monday</option><option value="Saturday">Saturday</option></Select></label>
          <label className="text-sm font-semibold sm:col-span-2">기준 시간대<Select className="mt-2" value={settings.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="Asia/Seoul">Asia/Seoul</option></Select></label>
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-green-700">{message}</p>}
        <Button type="button" className="mt-5 w-full sm:w-auto" onClick={() => setMessage(api.saveSettings(settings).message)}>설정 mock 저장</Button>
      </Card>
    </AdminGuard>
  );
}
