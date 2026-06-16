"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, ErrorState, Input, LoadingState, Select } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api, getApiErrorMessage, type ManagedUser } from "@/lib/api";
import type { AssignmentRole, Role } from "@/lib/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const state = useApiData(async () => {
    const [users, cells] = await Promise.all([api.getUsers(user), api.getCells(user)]);
    return { users, cells };
  }, [user.email]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<ManagedUser | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [cellId, setCellId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>("leader");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const users = state.data?.users ?? [];
    const selected = users.find((item) => item.user_id === selectedId) ?? users[0];
    if (selected) {
      setSelectedId(selected.user_id);
      setDraft(selected);
    }
    if (!cellId && state.data?.cells[0]) setCellId(state.data.cells[0].cell_id);
  }, [state.data, selectedId, cellId]);

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

  const toggleRole = (role: Role) => {
    if (!draft) return;
    setDraft({ ...draft, roles: draft.roles.includes(role) ? draft.roles.filter((item) => item !== role) : [...draft.roles, role] });
  };

  const createUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    await run(async () => {
      const created = await api.createUser(user, { name: newUserName.trim(), email: newUserEmail.trim(), roles: ["cell_leader"] });
      setSelectedId(created.user_id);
    }, "새 사용자를 등록했습니다.");
    setNewUserName("");
    setNewUserEmail("");
  };

  return <AdminGuard>
    <PageHeader title="사용자 관리" description="사용자 역할과 담당 셀 배정을 관리하세요." />
    {state.loading && <LoadingState />}
    {state.error && <ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState>}
    {state.data && <>
      <Card className="mb-5">
        <h2 className="font-bold">새 사용자 등록</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]"><Input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="사용자 이름" /><Input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} placeholder="user@example.com" /><Button type="button" disabled={saving} onClick={() => void createUser()}>등록</Button></div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">{state.data.users.map((item) => <button key={item.user_id} type="button" onClick={() => { setSelectedId(item.user_id); setDraft(item); setMessage(""); }} className={`focus-ring w-full rounded-2xl border bg-white p-4 text-left shadow-sm ${selectedId === item.user_id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="flex items-center justify-between gap-3"><span className="font-bold">{item.name}</span><Badge tone={item.active ? "success" : "neutral"}>{item.active ? "활성" : "비활성"}</Badge></div><p className="mt-2 text-xs text-slate-500">{item.roles.join(", ")}</p></button>)}</div>
        {draft && <Card>
          <h2 className="text-xl font-bold">{draft.name}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">이름<Input className="mt-2" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label className="text-sm font-semibold">이메일<Input className="mt-2" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
          </div>
          <div className="mt-5"><p className="text-sm font-semibold">역할</p><div className="mt-2 flex flex-wrap gap-3">{(["admin", "cell_leader"] as Role[]).map((role) => <label key={role} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm"><input type="checkbox" checked={draft.roles.includes(role)} onChange={() => toggleRole(role)} />{role}</label>)}</div></div>
          <label className="mt-4 flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm font-semibold"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />활성 계정</label>
          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">현재 담당 셀</p>
            <div className="mt-3 space-y-2">{draft.assigned_cells.map((assignment) => <div key={assignment.assignment_id} className="flex items-center justify-between rounded-xl bg-blue-50 p-3"><Badge tone="primary">{assignment.cell_name} · {assignment.assignment_role}</Badge><Button type="button" variant="ghost" disabled={saving} onClick={() => void run(() => api.unassignUserFromCell(user, assignment.assignment_id), "담당 셀 배정을 해제했습니다.")}>배정 해제</Button></div>)}{!draft.assigned_cells.length && <Badge tone="warning">배정 없음</Badge>}</div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_auto]"><Select value={cellId} onChange={(event) => setCellId(event.target.value)}>{state.data.cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select><Select value={assignmentRole} onChange={(event) => setAssignmentRole(event.target.value as AssignmentRole)}><option value="leader">대표 리더</option><option value="assistant">보조 리더</option></Select><Button type="button" variant="secondary" disabled={saving || !cellId} onClick={() => void run(() => api.assignUserToCell(user, draft.user_id, cellId, assignmentRole), "담당 셀을 배정했습니다.")}>배정</Button></div>
          </div>
          {message && <p className="mt-4 text-sm font-semibold text-slate-700">{message}</p>}
          <Button type="button" className="mt-5 w-full" disabled={saving || !draft.roles.length} onClick={() => void run(() => api.updateUser(user, { user_id: draft.user_id, name: draft.name, email: draft.email, roles: draft.roles, active: draft.active }), "사용자 정보를 저장했습니다.")}>사용자 정보 저장</Button>
        </Card>}
      </div>
    </>}
  </AdminGuard>;
}
