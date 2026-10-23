"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button, EmptyState, ErrorState, LoadingState, Select } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import { attendanceStatusOptions, getAttendanceStatusLabel, getAttendanceStatusMarker } from "@/lib/attendance";
import { formatDateString, getTodayInTimeZone, parseDateString } from "@/lib/date";
import { hasRole } from "@/lib/permissions";
import type { AttendanceStatus } from "@/lib/types";

export default function AttendancePage() {
  const { user, leaderMode } = useAuth();
  const [cellId, setCellId] = useState("all");
  const currentYM = getTodayInTimeZone().slice(0, 7);
  const [startMonth, setStartMonth] = useState(prevYM(currentYM));
  const [editingCell, setEditingCell] = useState<{ memberId: string; week: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const scope = leaderMode ? "leader" : "admin";
  const isAdmin = hasRole(user, "admin");

  const endMonth = nextYM(startMonth);
  const fromDate = `${startMonth}-01`;
  const toDate = lastDayOf(endMonth);
  const weeks = weeksInRange(fromDate, toDate);

  const cellsState = useApiData(() => api.getCells(user, { scope }), [user.email, leaderMode]);
  const sheetState = useApiData(() => api.getAttendanceSheet(user, {
    scope,
    cell_id: cellId === "all" ? undefined : cellId,
    from_date: fromDate,
    to_date: toDate,
  }), [user.email, leaderMode, cellId, fromDate, toDate]);

  const cells = cellsState.data ?? [];
  const members = [...(sheetState.data?.members ?? [])].sort((a, b) => {
    const c = a.cell_name.localeCompare(b.cell_name, "ko");
    return c !== 0 ? c : a.display_name.localeCompare(b.display_name, "ko");
  });
  const loading = cellsState.loading || sheetState.loading;
  const loadError = cellsState.error || sheetState.error;

  const handleSetStatus = async (memberId: string, week: string, status: AttendanceStatus) => {
    setSaving(true);
    setError("");
    try {
      await api.setAttendanceRecord(user, memberId, week, status);
      sheetState.setData((current) => current ? {
        ...current,
        members: current.members.map((m) =>
          m.member_id === memberId ? { ...m, attendance: { ...m.attendance, [week]: status } } : m,
        ),
      } : current);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
      setEditingCell(null);
    }
  };

  return (
    <>
      <PageHeader title="출석부" description="월별 출석 현황을 한눈에 확인하세요." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={cellId} onChange={(e) => setCellId(e.target.value)} aria-label="셀 필터" className="max-w-[200px]">
          <option value="all">전체 셀</option>
          {cells.map((c) => <option key={c.cell_id} value={c.cell_id}>{c.cell_name}</option>)}
        </Select>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setStartMonth(prevYM(startMonth))} aria-label="이전 달">◀</Button>
          <span className="min-w-[180px] text-center text-sm font-semibold">{fmtYM(startMonth)} – {fmtYM(endMonth)}</span>
          <Button type="button" variant="secondary" onClick={() => setStartMonth(nextYM(startMonth))} aria-label="다음 달">▶</Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading && <LoadingState>출석 데이터를 불러오는 중입니다.</LoadingState>}
      {loadError && <ErrorState onRetry={() => { void cellsState.reload(); void sheetState.reload(); }}>{loadError}</ErrorState>}

      {!loading && !loadError && (
        members.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 whitespace-nowrap">이름</th>
                  {cellId === "all" && <th className="px-3 py-3 whitespace-nowrap">셀</th>}
                  {weeks.map((w) => <th key={w} className="px-2 py-3 text-center whitespace-nowrap">{weekLabel(w)}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.member_id} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-semibold whitespace-nowrap">{m.display_name}</td>
                    {cellId === "all" && <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{m.cell_name}</td>}
                    {weeks.map((w) => {
                      const s = m.attendance[w] as AttendanceStatus | undefined;
                      const isEditing = editingCell?.memberId === m.member_id && editingCell?.week === w;
                      return (
                        <td key={w} className="relative px-2 py-2.5 text-center">
                          {isAdmin ? (
                            <button
                              type="button"
                              className="focus-ring inline-flex size-7 items-center justify-center rounded-full text-xs font-bold transition hover:ring-2 hover:ring-blue-300 disabled:opacity-50"
                              disabled={saving}
                              onClick={() => setEditingCell(isEditing ? null : { memberId: m.member_id, week: w })}
                              title={s ? getAttendanceStatusLabel(s) : "기록 없음 — 클릭하여 지정"}
                            >
                              {s ? (
                                <span className={`inline-flex size-7 items-center justify-center rounded-full ${statusStyle(s)}`}>
                                  {getAttendanceStatusMarker(s)}
                                </span>
                              ) : (
                                <span className="text-slate-300">–</span>
                              )}
                            </button>
                          ) : (
                            s ? (
                              <span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${statusStyle(s)}`} title={getAttendanceStatusLabel(s)}>
                                {getAttendanceStatusMarker(s)}
                              </span>
                            ) : (
                              <span className="text-slate-300">–</span>
                            )
                          )}
                          {isEditing && (
                            <StatusPicker
                              onSelect={(status) => void handleSetStatus(m.member_id, w, status)}
                              onClose={() => setEditingCell(null)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState>표시할 출석 데이터가 없습니다.</EmptyState>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <Legend marker="✓" label="출석" className="bg-green-100 text-green-700" />
        <Legend marker="×" label="결석" className="bg-rose-100 text-rose-700" />
        <Legend marker="!" label="사유 결석" className="bg-amber-100 text-amber-800" />
        <Legend marker="?" label="미확인" className="bg-slate-100 text-slate-600" />
        <span><span className="inline-flex size-5 items-center justify-center text-slate-300">–</span> 기록 없음</span>
        {isAdmin && <span className="text-blue-600">· 셀을 클릭하여 출석 상태를 지정할 수 있습니다</span>}
      </div>
    </>
  );
}

function StatusPicker({ onSelect, onClose }: { onSelect: (s: AttendanceStatus) => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2 flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
        {attendanceStatusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition hover:ring-2 hover:ring-blue-300 ${statusStyle(opt.value)}`}
            title={opt.label}
            onClick={() => onSelect(opt.value)}
          >
            {opt.marker}
          </button>
        ))}
      </div>
    </>
  );
}

function Legend({ marker, label, className }: { marker: string; label: string; className: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${className}`}>{marker}</span>
      {label}
    </span>
  );
}

function statusStyle(s: AttendanceStatus): string {
  switch (s) {
    case "present": return "bg-green-100 text-green-700";
    case "absent": return "bg-rose-100 text-rose-700";
    case "excused": return "bg-amber-100 text-amber-800";
    default: return "bg-slate-100 text-slate-600";
  }
}

function prevYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

function nextYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function fmtYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${y}년 ${m}월`;
}

function lastDayOf(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return formatDateString(new Date(Date.UTC(y, m, 0)));
}

function weeksInRange(from: string, to: string): string[] {
  const d = parseDateString(from);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  const end = parseDateString(to);
  const weeks: string[] = [];
  while (d <= end) {
    weeks.push(formatDateString(d));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return weeks;
}

function weekLabel(weekStart: string): string {
  const d = parseDateString(weekStart);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
