"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton } from "@/components/skeletons";
import { ReportStatusBadge } from "@/components/status-badge";
import { Badge, Card, ErrorState, LinkButton } from "@/components/ui";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { getTodayInTimeZone } from "@/lib/date";
import { getLongAbsenceWorkItems, getWeeklyReportWorkItems } from "@/lib/dashboard";

export default function DashboardPage() {
  const { user, leaderMode } = useAuth();
  const state = useApiData(async () => {
    const scope = leaderMode ? "leader" : "admin";
    const [cells, members, reports] = await Promise.all([
      api.getCells(user, { scope }),
      api.getMembers(user, { scope }),
      api.getReports(user, { scope }),
    ]);
    return { cells, members, reports };
  }, [user.email, leaderMode]);

  if (state.loading) return <><PageHeader title="돌봄 현황" /><DashboardSkeleton /></>;
  if (state.error) return <><PageHeader title="돌봄 현황" /><ErrorState onRetry={() => void state.reload()}>{state.error}</ErrorState></>;
  const { cells = [], members = [], reports = [] } = state.data ?? {};
  const today = getTodayInTimeZone();
  const reportWorkItems = getWeeklyReportWorkItems(cells, reports, today);
  const missingReports = reportWorkItems.filter((item) => item.status === "missing").length;
  const submittedReports = reportWorkItems.filter((item) => item.status === "submitted").length;
  const unresolvedMembers = members.filter((member) => member.unresolved_note_count > 0);
  const unresolved = unresolvedMembers.reduce((sum, member) => sum + member.unresolved_note_count, 0);
  const longAbsenceItems = getLongAbsenceWorkItems(members, today, 3);

  return (
    <>
      <PageHeader
        title={leaderMode ? "담당 셀 대시보드" : "돌봄 현황"}
        description={leaderMode ? "이번 주 작성 상태와 확인이 필요한 돌봄 항목을 먼저 표시합니다." : `${user.name}님의 조회 가능 범위 안에서 필요한 작업을 확인하세요.`}
        action={<LinkButton href="/reports/new">이번 주 리포트 작성</LinkButton>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="이번 주 리포트"
          value={`${submittedReports}/${cells.length} 제출`}
          helper={missingReports ? `${missingReports}개 셀 작성 필요` : "이번 주 제출 완료"}
          tone={missingReports ? "warning" : "success"}
          href="/reports/new"
        />
        <SummaryCard
          label="미해결 특이사항"
          value={`${unresolved}건`}
          helper={unresolvedMembers.length ? `${unresolvedMembers.length}명 확인 필요` : "미해결 항목 없음"}
          tone={unresolved ? "warning" : "neutral"}
          href="/members"
        />
        <SummaryCard
          label="장기결석 의심"
          value={`${longAbsenceItems.length}명`}
          helper="최근 3개월 출석 기준"
          tone={longAbsenceItems.length ? "warning" : "neutral"}
          href="/members"
        />
        <SummaryCard
          label={leaderMode ? "담당 셀 인원" : "조회 가능 인원"}
          value={`${members.length}명`}
          helper={`${cells.length}개 셀`}
          href="/members"
        />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card variant="list">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">이번 주 작성 상태</h2>
            <LinkButton href="/reports/new" variant="secondary">작성하기</LinkButton>
          </div>
          <div className="mt-4 space-y-3">
            {reportWorkItems.length ? reportWorkItems.map((item) => (
              <div key={item.cell_id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold">{item.cell_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.status === "missing" ? "아직 이번 주 리포트가 없습니다." : "이번 주 리포트가 있습니다."}</p>
                </div>
                <ReportWorkStatusBadge status={item.status} />
              </div>
            )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">담당 셀이 없습니다.</p>}
          </div>
        </Card>
        <Card variant="list">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">최근 리포트</h2>
            <LinkButton href="/reports" variant="secondary">목록 보기</LinkButton>
          </div>
          <div className="mt-4 space-y-3">
            {reports.slice(0, 5).map((report) => (
              <Link
                key={report.report_id}
                href={`/reports/${report.report_id}`}
                className="focus-ring flex items-center justify-between rounded-xl bg-slate-50 p-4 transition hover:bg-blue-50"
              >
                <div>
                  <p className="font-semibold">{report.cell_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{report.week_start_date} 주차 · {report.record_count}명 기록</p>
                </div>
                <ReportStatusBadge status={report.status} />
              </Link>
            ))}
            {!reports.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">최근 리포트가 없습니다.</p>}
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card variant="sensitive">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">미해결 특이사항</h2>
            <Badge tone={unresolved ? "warning" : "neutral"}>{unresolved}건</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {unresolvedMembers.slice(0, 5).map((member) => (
              <Link key={member.member_id} href={`/members/${member.member_id}`} className="focus-ring flex items-center justify-between rounded-xl bg-slate-50 p-4 hover:bg-blue-50">
                <div>
                  <p className="font-semibold">{member.display_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{member.current_cell_name ?? "미지정 셀"}</p>
                </div>
                <Badge tone="warning">{member.unresolved_note_count}건</Badge>
              </Link>
            ))}
            {!unresolvedMembers.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">미해결 특이사항이 없습니다.</p>}
          </div>
        </Card>
        <Card variant="list">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">장기결석 의심</h2>
            <Badge tone={longAbsenceItems.length ? "warning" : "neutral"}>{longAbsenceItems.length}명</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {longAbsenceItems.slice(0, 5).map((item) => (
              <Link key={item.member_id} href={`/members/${item.member_id}`} className="focus-ring flex items-center justify-between rounded-xl bg-slate-50 p-4 hover:bg-blue-50">
                <div>
                  <p className="font-semibold">{item.display_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.current_cell_name ?? "미지정 셀"}</p>
                </div>
                <span className="text-right text-xs text-slate-500">
                  마지막 출석<br />{item.last_attendance_date ?? "기록 없음"}
                </span>
              </Link>
            ))}
            {!longAbsenceItems.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">확인이 필요한 장기결석 의심 인원이 없습니다.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  href: string;
  tone?: "neutral" | "warning" | "success";
}) {
  return (
    <Card variant="summary">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
      <LinkButton href={href} variant="secondary" className="mt-5 w-full">바로가기</LinkButton>
    </Card>
  );
}

function ReportWorkStatusBadge({ status }: { status: "draft" | "submitted" | "locked" | "missing" }) {
  if (status === "missing") return <Badge tone="warning" marker="!" srLabel="이번 주 리포트 상태">작성 필요</Badge>;
  return <ReportStatusBadge status={status} />;
}
