"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, ErrorState, Input, LoadingState, Select } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage } from "@/lib/api";
import type { Cell } from "@/lib/types";

export default function AdminCellsPage() {
  const { user } = useAuth();
  const state = useApiData(async () => {
    const [cells, members, users] = await Promise.all([api.getCells(user), api.getMembers(user), api.getUsers(user)]);
    return { cells, members, users };
  }, [user.email]);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [movingMember, setMovingMember] = useState<string | null>(null);

  const updateCell = (cellId: string, patch: Partial<Cell>) => {
    state.setData((current) => current ? {
      ...current,
      cells: current.cells.map((cell) => cell.cell_id === cellId ? { ...cell, ...patch } : cell),
    } : current);
  };

  const toggleExpand = (cellId: string) => {
    setExpandedCells((current) => {
      const next = new Set(current);
      if (next.has(cellId)) next.delete(cellId);
      else next.add(cellId);
      return next;
    });
  };

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true);
    setMessage("");
    try {
      await action();
      await state.reload();
      setMessage(successMessage);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const reassign = async (memberId: string, newCellId: string) => {
    setMovingMember(memberId);
    try {
      await api.reassignMemberCell(user, memberId, newCellId);
      await state.reload();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setMovingMember(null);
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    await run(() => api.createCell(user, newName.trim()), "새 셀을 생성했습니다.");
    setNewName("");
  };

  return (
    <AdminGuard>
      <PageHeader title="셀 관리" description="셀 정보와 담당자 배정을 관리하세요." />
      {state.loading && <LoadingState />}
      {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
      {state.data && (() => {
        const data = state.data;
        const sortedCells = [...data.cells].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return <>
        <Card className="mb-5">
          <h2 className="font-bold">새 셀 생성</h2>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="셀 이름" /><Button type="button" disabled={saving} onClick={() => void create()}>생성</Button></div>
          {message && <p className="mt-3 text-sm font-semibold text-slate-700">{message}</p>}
        </Card>
        <div className="space-y-4">
          {sortedCells.map((cell) => {
            const assignedUsers = data.users.filter((item) => item.assigned_cells.some((assignment) => assignment.cell_id === cell.cell_id));
            const cellMembers = data.members.filter((member) => member.current_cell_id === cell.cell_id);
            const expanded = expandedCells.has(cell.cell_id);
            return <Card key={cell.cell_id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_130px_130px_auto] lg:items-end">
                <label className="text-sm font-semibold">셀 이름<Input className="mt-2" value={cell.cell_name} onChange={(event) => updateCell(cell.cell_id, { cell_name: event.target.value })} /></label>
                <label className="text-sm font-semibold">표시 순서<Input className="mt-2" type="number" value={cell.sort_order} onChange={(event) => updateCell(cell.cell_id, { sort_order: Number(event.target.value) })} /></label>
                <label className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-semibold"><input type="checkbox" checked={cell.active} onChange={(event) => updateCell(cell.cell_id, { active: event.target.checked })} />운영 중</label>
                <Button type="button" variant="secondary" disabled={saving} onClick={() => void run(() => api.updateCell(user, cell), "셀 정보를 저장했습니다.")}>저장</Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => toggleExpand(cell.cell_id)} className="focus-ring rounded-full transition hover:bg-slate-100">
                  <Badge tone="neutral">소속 {cellMembers.length}명 {expanded ? "▲" : "▼"}</Badge>
                </button>
                {assignedUsers.map((assignedUser) => <Badge key={assignedUser.user_id} tone="primary">{assignedUser.name}</Badge>)}
                {!assignedUsers.length && <Badge tone="warning">담당자 없음</Badge>}
              </div>
              {expanded && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  {cellMembers.length ? (
                    <div className="divide-y divide-slate-200">
                      {cellMembers.map((member) => (
                        <div key={member.member_id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-semibold">{member.display_name}</span>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500">이동:</label>
                            <Select
                              className="max-w-[180px] text-xs"
                              value={cell.cell_id}
                              disabled={movingMember === member.member_id}
                              onChange={(event) => void reassign(member.member_id, event.target.value)}
                              aria-label={`${member.display_name} 셀 이동`}
                            >
                              {sortedCells.filter((c) => c.active).map((c) => (
                                <option key={c.cell_id} value={c.cell_id}>{c.cell_name}</option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">소속 셀원이 없습니다.</p>
                  )}
                </div>
              )}
            </Card>;
          })}
        </div>
        </>;
      })()}
    </AdminGuard>
  );
}
