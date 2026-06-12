"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Input } from "@/components/ui";
import { mockApi as api } from "@/lib/api";
import { mockCells } from "@/lib/mock-data";
import type { Cell } from "@/lib/types";

export default function AdminCellsPage() {
  const { user } = useAuth();
  const [cells, setCells] = useState<Cell[]>(mockCells);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const members = api.getMembers(user);
  const assignments = api.getAssignments();
  const users = api.getUsers();

  const updateCell = (cellId: string, patch: Partial<Cell>) => {
    setCells((items) => items.map((cell) => cell.cell_id === cellId ? { ...cell, ...patch } : cell));
  };

  const save = (cell: Cell) => setMessage(api.saveCell(cell).message);
  const create = () => {
    if (!newName.trim()) return;
    const result = api.createCell(newName.trim());
    setCells((items) => [...items, { cell_id: `cell_mock_${items.length + 1}`, cell_name: newName.trim(), active: true, sort_order: items.length + 1, created_at: "2026-06-12 09:00:00", updated_at: "2026-06-12 09:00:00" }]);
    setNewName("");
    setMessage(result.message);
  };

  return (
    <AdminGuard>
      <PageHeader title="셀 관리" description="셀 정보와 user_cell_assignments 기반 담당자를 관리합니다." />
      <Card className="mb-5">
        <h2 className="font-bold">새 셀 생성</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="샘플 셀 이름" /><Button type="button" onClick={create}>mock 생성</Button></div>
        {message && <p className="mt-3 text-sm font-semibold text-green-700">{message}</p>}
      </Card>
      <div className="space-y-4">
        {[...cells].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((cell) => {
          const cellAssignments = assignments.filter((assignment) => assignment.cell_id === cell.cell_id && assignment.active);
          return (
            <Card key={cell.cell_id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_130px_130px_auto] lg:items-end">
                <label className="text-sm font-semibold">셀 이름<Input className="mt-2" value={cell.cell_name} onChange={(event) => updateCell(cell.cell_id, { cell_name: event.target.value })} /></label>
                <label className="text-sm font-semibold">표시 순서<Input className="mt-2" type="number" value={cell.sort_order ?? 0} onChange={(event) => updateCell(cell.cell_id, { sort_order: Number(event.target.value) })} /></label>
                <label className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-semibold"><input type="checkbox" checked={cell.active} onChange={(event) => updateCell(cell.cell_id, { active: event.target.checked })} />운영 중</label>
                <Button type="button" variant="secondary" onClick={() => save(cell)}>mock 저장</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="neutral">소속 {members.filter((member) => member.current_cell_id === cell.cell_id).length}명</Badge>
                {cellAssignments.map((assignment) => <Badge key={assignment.assignment_id} tone="primary">{users.find((item) => item.user_id === assignment.user_id)?.name ?? "알 수 없음"} · {assignment.assignment_role}</Badge>)}
                {!cellAssignments.length && <Badge tone="warning">담당자 없음</Badge>}
              </div>
            </Card>
          );
        })}
      </div>
    </AdminGuard>
  );
}
