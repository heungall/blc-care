"use client";

import { useMemo, useState } from "react";
import { useApiData } from "@/hooks/use-api-data";
import { MemberCard } from "@/components/member-card";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, Input, LoadingState, Select } from "@/components/ui";
import { api } from "@/lib/api";

export default function MembersPage() {
  const { user, leaderMode } = useAuth();
  const [query, setQuery] = useState("");
  const [cellId, setCellId] = useState("all");
  const scope = leaderMode ? "leader" : "admin";
  const cellsState = useApiData(() => api.getCells(user, { scope }), [user.email, leaderMode]);
  const membersState = useApiData(() => api.getMembers(user, { scope }), [user.email, leaderMode]);
  const cells = cellsState.data ?? [];
  const members = useMemo(() => (membersState.data ?? []).filter((member) => (cellId === "all" || member.current_cell_id === cellId) && member.display_name.includes(query.trim())), [membersState.data, cellId, query]);

  return (
    <>
      <PageHeader title="성도 목록" description={leaderMode ? "셀리더 모드에서는 배정된 셀 성도만 표시합니다." : "목록에서는 돌봄에 필요한 최소 정보만 표시합니다."} />
      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름으로 검색" aria-label="성도 검색" />
        <Select value={cellId} onChange={(event) => setCellId(event.target.value)} aria-label="셀 필터"><option value="all">전체 셀</option>{cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}</Select>
      </div>
      {(cellsState.loading || membersState.loading) && <LoadingState />}
      {(cellsState.error || membersState.error) && <ErrorState onRetry={() => { void cellsState.reload(); void membersState.reload(); }}>{cellsState.error || membersState.error}</ErrorState>}
      {!cellsState.loading && !membersState.loading && !cellsState.error && !membersState.error && (members.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{members.map((member) => <MemberCard key={member.member_id} member={member} />)}</div> : <EmptyState>표시할 성도가 없습니다.</EmptyState>)}
    </>
  );
}
