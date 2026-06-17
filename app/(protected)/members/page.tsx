"use client";

import Link from "next/link";
import { useState } from "react";
import { useApiData } from "@/hooks/use-api-data";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberCard } from "@/components/member-card";
import { MemberStatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button, EmptyState, ErrorState, Input, LoadingState, Select } from "@/components/ui";
import { api } from "@/lib/api";
import type { MemberStatus } from "@/lib/types";

const pageSize = 20;
const statusOptions: Array<{ value: "all" | MemberStatus; label: string }> = [
  { value: "all", label: "전체 상태" },
  { value: "active", label: "활동" },
  { value: "dormant", label: "휴면" },
  { value: "left", label: "출석 중단" },
  { value: "archived", label: "보관" },
];

export default function MembersPage() {
  const { user, leaderMode } = useAuth();
  const [query, setQuery] = useState("");
  const [cellId, setCellId] = useState("all");
  const [status, setStatus] = useState<"all" | MemberStatus>("all");
  const [sort, setSort] = useState<"name_asc" | "name_desc">("name_asc");
  const [page, setPage] = useState(1);
  const scope = leaderMode ? "leader" : "admin";
  const cellsState = useApiData(() => api.getCells(user, { scope }), [user.email, leaderMode]);
  const membersState = useApiData(() => api.getMembersList(user, {
    scope,
    keyword: query.trim() || undefined,
    cell_id: cellId === "all" ? undefined : cellId,
    status: status === "all" ? undefined : status,
    sort,
    page,
    page_size: pageSize,
  }), [user.email, leaderMode, query, cellId, status, sort, page]);
  const cells = cellsState.data ?? [];
  const members = membersState.data?.items ?? [];
  const pagination = membersState.data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const total = pagination?.total ?? 0;

  const resetPage = () => setPage(1);

  return (
    <>
      <PageHeader title="성도 목록" description={leaderMode ? "셀리더 모드에서는 배정된 셀 성도만 표시합니다." : "목록에서는 돌봄에 필요한 최소 정보만 표시합니다."} />
      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-[1fr_220px_170px_170px]">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetPage();
          }}
          placeholder="이름 또는 별칭으로 검색"
          aria-label="성도 검색"
        />
        <Select
          value={cellId}
          onChange={(event) => {
            setCellId(event.target.value);
            resetPage();
          }}
          aria-label="셀 필터"
        >
          <option value="all">전체 셀</option>
          {cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}
        </Select>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "all" | MemberStatus);
            resetPage();
          }}
          aria-label="상태 필터"
        >
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
        <Select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as "name_asc" | "name_desc");
            resetPage();
          }}
          aria-label="이름 정렬"
        >
          <option value="name_asc">이름 오름차순</option>
          <option value="name_desc">이름 내림차순</option>
        </Select>
      </div>
      {(cellsState.loading || membersState.loading) && <LoadingState />}
      {(cellsState.error || membersState.error) && <ErrorState onRetry={() => { void cellsState.reload(); void membersState.reload(); }}>{cellsState.error || membersState.error}</ErrorState>}
      {!cellsState.loading && !membersState.loading && !cellsState.error && !membersState.error && (
        members.length ? (
          <>
            <div className="grid gap-4 md:hidden">
              {members.map((member) => <MemberCard key={member.member_id} member={member} />)}
            </div>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">이름</th>
                    <th className="px-4 py-3">셀</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">마지막 출석</th>
                    <th className="px-4 py-3">특이사항</th>
                    <th className="px-4 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <tr key={member.member_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <MemberAvatar name={member.display_name} />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">{member.display_name}</div>
                            <div className="truncate text-xs text-slate-500">{member.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{member.current_cell_name ?? "미지정 셀"}</td>
                      <td className="px-4 py-3"><MemberStatusBadge status={member.status} /></td>
                      <td className="px-4 py-3 text-slate-600">{member.last_attendance_date ?? "기록 없음"}</td>
                      <td className="px-4 py-3 text-slate-600">{member.unresolved_note_count ? `${member.unresolved_note_count}건` : "없음"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/members/${member.member_id}`} className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                          보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>총 {total}명 · {page} / {totalPages}페이지</p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  이전
                </Button>
                <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                  다음
                </Button>
              </div>
            </div>
          </>
        ) : <EmptyState>표시할 성도가 없습니다.</EmptyState>
      )}
    </>
  );
}
