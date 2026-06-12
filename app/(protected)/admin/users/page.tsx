"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Select, Input } from "@/components/ui";
import { mockApi as api } from "@/lib/api";
import { mockAssignments, mockCells, mockUsers } from "@/lib/mock-data";
import type { AssignmentRole, Role, User, UserCellAssignment } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [assignments, setAssignments] = useState<UserCellAssignment[]>(mockAssignments);
  const [selectedId, setSelectedId] = useState(mockUsers[0]?.user_id ?? "");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [cellId, setCellId] = useState(mockCells[0]?.cell_id ?? "");
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>("leader");
  const [message, setMessage] = useState("");
  const selected = users.find((user) => user.user_id === selectedId);

  const updateSelected = (patch: Partial<User>) => {
    setUsers((items) => items.map((user) => user.user_id === selectedId ? { ...user, ...patch } : user));
  };
  const toggleRole = (role: Role) => {
    if (!selected) return;
    updateSelected({ roles: selected.roles.includes(role) ? selected.roles.filter((item) => item !== role) : [...selected.roles, role] });
  };
  const save = () => {
    if (!selected) return;
    setMessage(api.saveUser(selected.user_id, selected.name, selected.email, selected.roles, selected.active).message);
  };
  const assign = () => {
    if (!selected) return;
    const result = api.assignUserToCell(selected.user_id, cellId, assignmentRole);
    setAssignments((items) => [...items.filter((item) => !(item.user_id === selected.user_id && item.cell_id === cellId)), { assignment_id: `assign_mock_${Date.now()}`, user_id: selected.user_id, cell_id: cellId, assignment_role: assignmentRole, active: true, start_date: "2026-06-12", created_at: "2026-06-12 09:00:00", updated_at: "2026-06-12 09:00:00" }]);
    setMessage(result.message);
  };
  const removeAssignment = (assignmentId: string) => {
    setAssignments((items) => items.filter((item) => item.assignment_id !== assignmentId));
    setMessage(api.removeUserCellAssignment(assignmentId).message);
  };
  const createUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const nextUser: User = { user_id: `user_mock_${Date.now()}`, name: newUserName.trim(), email: newUserEmail.trim(), roles: ["cell_leader"], active: true, created_at: "2026-06-12 09:00:00", updated_at: "2026-06-12 09:00:00" };
    setUsers((items) => [...items, nextUser]);
    setSelectedId(nextUser.user_id);
    setMessage(api.createUser(nextUser.name, nextUser.email).message);
    setNewUserName("");
    setNewUserEmail("");
  };

  return (
    <AdminGuard>
      <PageHeader title="사용자 관리" description="복수 역할과 담당 셀 배정을 mock으로 관리합니다." />
      <Card className="mb-5">
        <h2 className="font-bold">새 사용자 등록</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]"><Input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="샘플 사용자 이름" /><Input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} placeholder="sample-user@example.invalid" /><Button type="button" onClick={createUser}>mock 등록</Button></div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">{users.map((user) => <button key={user.user_id} type="button" onClick={() => { setSelectedId(user.user_id); setMessage(""); }} className={`focus-ring w-full rounded-2xl border bg-white p-4 text-left shadow-sm ${selectedId === user.user_id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="flex items-center justify-between gap-3"><span className="font-bold">{user.name}</span><Badge tone={user.active ? "success" : "neutral"}>{user.active ? "활성" : "비활성"}</Badge></div><p className="mt-2 text-xs text-slate-500">{user.roles.join(", ")}</p></button>)}</div>
        {selected && <Card>
          <h2 className="text-xl font-bold">{selected.name}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">이름<Input className="mt-2" value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} /></label>
            <label className="text-sm font-semibold">이메일<Input className="mt-2" value={selected.email} onChange={(event) => updateSelected({ email: event.target.value })} /></label>
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold">역할</p>
            <div className="mt-2 flex flex-wrap gap-3">{(["admin", "cell_leader"] as Role[]).map((role) => <label key={role} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm"><input type="checkbox" checked={selected.roles.includes(role)} onChange={() => toggleRole(role)} />{role}</label>)}</div>
          </div>
          <label className="mt-4 flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm font-semibold"><input type="checkbox" checked={selected.active} onChange={(event) => updateSelected({ active: event.target.checked })} />활성 계정</label>
          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">현재 담당 셀</p>
            <div className="mt-3 space-y-2">{assignments.filter((assignment) => assignment.user_id === selected.user_id && assignment.active).map((assignment) => <div key={assignment.assignment_id} className="flex items-center justify-between rounded-xl bg-blue-50 p-3"><Badge tone="primary">{api.cellName(assignment.cell_id)} · {assignment.assignment_role}</Badge><Button type="button" variant="ghost" onClick={() => removeAssignment(assignment.assignment_id)}>배정 해제</Button></div>)}{!assignments.some((assignment) => assignment.user_id === selected.user_id && assignment.active) && <Badge tone="warning">배정 없음</Badge>}</div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_auto]"><Select value={cellId} onChange={(event) => setCellId(event.target.value)}>{mockCells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select><Select value={assignmentRole} onChange={(event) => setAssignmentRole(event.target.value as AssignmentRole)}><option value="leader">대표 리더</option><option value="assistant">보조 리더</option></Select><Button type="button" variant="secondary" onClick={assign}>배정 mock</Button></div>
          </div>
          {message && <p className="mt-4 text-sm font-semibold text-green-700">{message}</p>}
          <Button type="button" className="mt-5 w-full" onClick={save}>사용자 정보 mock 저장</Button>
        </Card>}
      </div>
    </AdminGuard>
  );
}
