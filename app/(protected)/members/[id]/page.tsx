"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { MemberStatusBadge } from "@/components/status-badge";
import { Badge, Card, EmptyState, ErrorState, LinkButton, LoadingState } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const state = useApiData(() => api.getMemberDetail(user, params.id), [user.email, params.id]);

  if (state.loading) return <><PageHeader title="성도 상세" /><LoadingState /></>;
  if (state.error) return <><PageHeader title="성도 상세" /><ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState></>;
  if (!state.data) return <><PageHeader title="성도 상세" /><EmptyState>조회할 성도 정보가 없습니다.</EmptyState></>;

  const { member, history } = state.data;
  return (
    <>
      <PageHeader title={member.display_name} description={`${member.current_cell_name ?? "미지정 셀"} · 민감 정보는 필요한 범위에서만 확인해주세요.`} action={<LinkButton href="/members" variant="secondary">목록으로</LinkButton>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <div className="flex items-center gap-4"><div className="flex size-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">{member.display_name.slice(-1)}</div><div><h2 className="text-xl font-bold">{member.display_name}</h2><div className="mt-2"><MemberStatusBadge status={member.status} /></div></div></div>
          <dl className="mt-6 space-y-4 text-sm">
            <Info label="별칭" value={member.name_aliases.join(", ")} />
            <Info label="연락처" value={member.phone} />
            <Info label="거주지" value={member.address} />
            <Info label="직장" value={member.workplace} />
            <Info label="직업" value={member.occupation} />
            <Info label="직책" value={member.job_title} />
            <Info label="등록일" value={member.registration_date} />
            <Info label="믿음 시작 연도" value={member.faith_start_year} />
          </dl>
        </Card>
        <div className="space-y-5">
          <Card><h2 className="text-lg font-bold">최근 돌봄 기록</h2><div className="mt-4 space-y-3">{history.records.length ? history.records.map((record) => <div key={record.record_id} className="rounded-xl bg-slate-50 p-4"><Badge tone="neutral">{record.attendance_status}</Badge><p className="mt-3 text-sm text-slate-600">{record.sharing_summary}</p><p className="mt-2 text-sm text-slate-500">{record.prayer_request}</p></div>) : <p className="text-sm text-slate-500">아직 기록이 없습니다.</p>}</div></Card>
          <Card><h2 className="text-lg font-bold">특이사항</h2><div className="mt-4 space-y-3">{history.notes.length ? history.notes.map((note) => <div key={note.note_id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><Badge tone={note.resolved ? "success" : "warning"}>{note.resolved ? "해결" : "확인 필요"}</Badge><span className="text-xs text-slate-400">{note.recorded_date}</span></div><p className="mt-3 text-sm text-slate-600">{note.note}</p></div>) : <p className="text-sm text-slate-500">표시할 특이사항이 없습니다.</p>}</div></Card>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-slate-100 pb-3 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="font-medium">{value || "입력 없음"}</dd></div>;
}
