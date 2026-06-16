"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button, Card, ErrorState, Input, LoadingState, Select } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AppSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const state = useApiData(() => api.getSettings(user), [user.email]);
  const [message, setMessage] = useState("");
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => state.setData((current) => current ? { ...current, [key]: value } : current);
  const save = async () => {
    if (!state.data) return;
    try {
      state.setData(await api.updateSettings(user, state.data));
      setMessage("시스템 설정을 저장했습니다.");
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  };

  return <AdminGuard>
    <PageHeader title="시스템 설정" description="서비스 운영에 필요한 설정을 관리하세요." />
    {state.loading && <LoadingState />}
    {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
    {state.data && <Card className="max-w-3xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">교회명<Input className="mt-2" value={state.data.church_name} onChange={(event) => update("church_name", event.target.value)} /></label>
        <label className="text-sm font-semibold">앱 이름<Input className="mt-2" value={state.data.app_name} onChange={(event) => update("app_name", event.target.value)} /></label>
        <label className="text-sm font-semibold">장기결석 기준 개월 수<Input className="mt-2" type="number" min="1" value={state.data.long_absence_months} onChange={(event) => update("long_absence_months", Number(event.target.value))} /></label>
        <label className="text-sm font-semibold">리포트 수정 마감 요일<Select className="mt-2" value={state.data.report_edit_deadline_day} onChange={(event) => update("report_edit_deadline_day", event.target.value)}><option value="Sunday">Sunday</option><option value="Monday">Monday</option><option value="Saturday">Saturday</option></Select></label>
        <label className="text-sm font-semibold sm:col-span-2">기준 시간대<Select className="mt-2" value={state.data.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="Asia/Seoul">Asia/Seoul</option></Select></label>
      </div>
      {message && <p className="mt-4 text-sm font-semibold text-slate-700">{message}</p>}
      <Button type="button" className="mt-5 w-full sm:w-auto" onClick={() => void save()}>설정 저장</Button>
    </Card>}
  </AdminGuard>;
}
