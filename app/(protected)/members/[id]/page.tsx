"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberEditForm } from "@/components/member-edit-form";
import { PageHeader } from "@/components/page-header";
import { MemberStatusBadge } from "@/components/status-badge";
import { Badge, Button, Card, EmptyState, ErrorState, LinkButton, LoadingState } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import type { BaptismStatus, BibleStudyStatus } from "@/lib/types";

const bibleStudyLabels: Record<BibleStudyStatus, string> = {
  unknown: "성경공부 미확인",
  not_started: "성경공부 시작 전",
  in_progress: "성경공부 진행 중",
  completed: "성경공부 완료",
};

const baptismLabels: Record<BaptismStatus, string> = {
  unknown: "세례 미확인",
  not_baptized: "미세례",
  baptized: "세례",
  infant_baptized: "유아세례",
  confirmation: "입교",
};

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, leaderMode } = useAuth();
  const [editing, setEditing] = useState(false);
  const scope = leaderMode ? "leader" : "admin";
  const state = useApiData(() => api.getMemberDetail(user, params.id, { scope }), [user.email, params.id, leaderMode]);
  const cellsState = useApiData(() => api.getCells(user, { scope }), [user.email, leaderMode]);

  if (state.loading) return <><PageHeader title="성도 상세" /><LoadingState /></>;
  if (state.error) return <><PageHeader title="성도 상세" /><ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState></>;
  if (!state.data) return <><PageHeader title="성도 상세" /><EmptyState>조회할 성도 정보가 없습니다.</EmptyState></>;

  const { member, history } = state.data;
  const lastAttendanceDate = history.records.find((record) => record.attendance_status === "present")?.report_date;
  const faithSummary = [
    member.bible_study_status ? bibleStudyLabels[member.bible_study_status] : null,
    member.baptism_status ? baptismLabels[member.baptism_status] : null,
  ].filter(Boolean).join(" · ");
  const action = editing
    ? undefined
    : <div className="flex gap-2"><LinkButton href="/members" variant="secondary">목록으로</LinkButton><Button type="button" onClick={() => setEditing(true)}>정보 수정</Button></div>;

  return (
    <>
      <PageHeader title={member.display_name} description={`${member.current_cell_name ?? "미지정 셀"} · 민감 정보는 돌봄에 필요한 범위에서만 확인해주세요.`} action={action} />
      {editing ? (
        <>
          {cellsState.loading && <LoadingState>셀 목록을 불러오는 중입니다.</LoadingState>}
          {cellsState.error && <ErrorState onRetry={() => void cellsState.reload()}>{cellsState.error}</ErrorState>}
          {cellsState.data && (
            <MemberEditForm
              user={user}
              member={member}
              cells={cellsState.data}
              scope={scope}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                state.setData({ ...state.data!, member: updated });
                setEditing(false);
              }}
            />
          )}
        </>
      ) : (
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-4">
              <MemberAvatar name={member.display_name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{member.display_name}</h2>
                  <MemberStatusBadge status={member.status} />
                  <Badge tone="primary">{member.current_cell_name ?? "미지정 셀"}</Badge>
                </div>
                {member.full_name !== member.display_name && <p className="mt-1 text-sm text-slate-500">{member.full_name}</p>}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryItem label="연락처">
                <span>{member.phone || "입력 없음"}</span>
                {member.phone && (
                  <a
                    href={`tel:${member.phone.replace(/[^\d+]/g, "")}`}
                    className="focus-ring inline-flex size-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                    aria-label={`${member.display_name}에게 전화하기`}
                    title="전화하기"
                  >
                    <PhoneIcon />
                  </a>
                )}
              </SummaryItem>
              <SummaryItem label="직장 · 직업">{[member.workplace, member.occupation].filter(Boolean).join(" · ") || "입력 없음"}</SummaryItem>
              <SummaryItem label="등록일">{member.registration_date || "입력 없음"}</SummaryItem>
              <SummaryItem label="최근 출석">{lastAttendanceDate || "기록 없음"}</SummaryItem>
              <SummaryItem label="신앙 상태">{faithSummary || "입력 없음"}</SummaryItem>
            </div>

            <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50">
              <summary className="focus-ring cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-slate-700">전체 정보 보기</summary>
              <dl className="grid gap-x-6 gap-y-4 border-t border-slate-200 px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Info label="본명" value={member.full_name} />
                <Info label="표시 이름" value={member.display_name} />
                <Info label="별칭" value={member.name_aliases.join(", ")} />
                <Info label="생년월일" value={member.birth_date} />
                <Info label="나이" value={member.age} />
                <Info label="첫 방문일" value={member.first_visit_date} />
                <Info label="주소" value={member.address} />
                <Info label="직책" value={member.job_title} />
                <Info label="신앙 시작 연도" value={member.faith_start_year} />
                <Info label="성경공부 상태" value={member.bible_study_status ? bibleStudyLabels[member.bible_study_status] : undefined} />
                <Info label="세례 상태" value={member.baptism_status ? baptismLabels[member.baptism_status] : undefined} />
                <Info label="가족 정보" value={member.family_info} />
                <Info label="관리 메모" value={member.memo} className="sm:col-span-2 lg:col-span-3" />
              </dl>
            </details>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card><h2 className="text-lg font-bold">최근 돌봄 기록</h2><div className="mt-4 space-y-3">{history.records.length ? history.records.map((record) => <div key={record.record_id} className="rounded-xl bg-slate-50 p-4"><AttendanceStatusBadge status={record.attendance_status} /><p className="mt-3 text-sm text-slate-600">{record.sharing_summary}</p><p className="mt-2 text-sm text-slate-500">{record.prayer_request}</p></div>) : <p className="text-sm text-slate-500">아직 기록이 없습니다.</p>}</div></Card>
            <Card><h2 className="text-lg font-bold">특이사항</h2><div className="mt-4 space-y-3">{history.notes.length ? history.notes.map((note) => <div key={note.note_id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><Badge tone={note.resolved ? "success" : "warning"}>{note.resolved ? "해결" : "확인 필요"}</Badge><span className="text-xs text-slate-400">{note.recorded_date}</span></div><p className="mt-3 text-sm text-slate-600">{note.note}</p></div>) : <p className="text-sm text-slate-500">표시할 특이사항이 없습니다.</p>}</div></Card>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="mt-1 flex min-h-9 items-center justify-between gap-3 text-sm font-semibold text-slate-800">{children}</div></div>;
}

function Info({ label, value, className = "" }: { label: string; value?: string | number; className?: string }) {
  return <div className={className}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap font-medium text-slate-800">{value || "입력 없음"}</dd></div>;
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h3l2 5-2 1a14 14 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
