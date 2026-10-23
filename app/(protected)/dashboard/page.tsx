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

      {/* Top metrics: compact horizontal bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricTile label="이번 주 리포트" value={`${submittedReports}/${cells.length}`} sub={missingReports ? `${missingReports}개 미제출` : "제출 완료"} tone={missingReports ? "warning" : "success"} />
        <MetricTile label="미해결 특이사항" value={`${unresolved}건`} sub={unresolvedMembers.length ? `${unresolvedMembers.length}명` : "없음"} tone={unresolved ? "warning" : "neutral"} />
        <MetricTile label="장기결석 의심" value={`${longAbsenceItems.length}명`} sub="3개월 기준" tone={longAbsenceItems.length ? "warning" : "neutral"} />
        <MetricTile label={leaderMode ? "담당 인원" : "전체 인원"} value={`${members.length}명`} sub={`${cells.length}개 셀`} tone="neutral" />
      </div>

      {/* Main content: 2 columns */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: This week status + Recent reports */}
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">이번 주 셀별 상태</h2>
              <LinkButton href="/reports/new" variant="secondary">작성하기</LinkButton>
            </div>
            {reportWorkItems.length ? (
              <div className="mt-4 divide-y divide-slate-100">
                {reportWorkItems.map((item) => (
                  <div key={item.cell_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`size-2 rounded-full ${item.status === "missing" ? "bg-amber-400" : item.status === "submitted" ? "bg-green-400" : "bg-slate-300"}`} />
                    <span className="flex-1 text-sm font-semibold">{item.cell_name}</span>
                    <ReportWorkStatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-slate-400">담당 셀이 없습니다.</p>}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">최근 리포트</h2>
              <LinkButton href="/reports" variant="secondary">전체 보기</LinkButton>
            </div>
            {reports.length ? (
              <div className="mt-4 divide-y divide-slate-100">
                {reports.slice(0, 5).map((report) => (
                  <Link key={report.report_id} href={`/reports/${report.report_id}`} className="focus-ring flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition hover:bg-blue-50 -mx-2 px-2 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{report.cell_name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{report.week_start_date} 주차 · {report.record_count}명</p>
                    </div>
                    <ReportStatusBadge status={report.status} />
                  </Link>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-slate-400">최근 리포트가 없습니다.</p>}
          </Card>
        </div>

        {/* Right: Alerts */}
        <div className="space-y-5">
          {(unresolvedMembers.length > 0 || longAbsenceItems.length > 0) ? (
            <>
              {unresolvedMembers.length > 0 && (
                <Card variant="sensitive">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">미해결 특이사항</h2>
                    <Badge tone="warning">{unresolved}건</Badge>
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {unresolvedMembers.slice(0, 8).map((member) => (
                      <Link key={member.member_id} href={`/members/${member.member_id}`} className="focus-ring flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 transition hover:bg-blue-50 -mx-2 px-2 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{member.display_name}</p>
                          <p className="text-xs text-slate-400">{member.current_cell_name ?? "미지정"}</p>
                        </div>
                        <Badge tone="warning">{member.unresolved_note_count}건</Badge>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
              {longAbsenceItems.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">장기결석 의심</h2>
                    <Badge tone={longAbsenceItems.length ? "warning" : "neutral"}>{longAbsenceItems.length}명</Badge>
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {longAbsenceItems.slice(0, 8).map((item) => (
                      <Link key={item.member_id} href={`/members/${item.member_id}`} className="focus-ring flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 transition hover:bg-blue-50 -mx-2 px-2 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{item.display_name}</p>
                          <p className="text-xs text-slate-400">{item.current_cell_name ?? "미지정"}</p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{item.last_attendance_date ?? "기록 없음"}</span>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <p className="py-6 text-center text-sm text-slate-400">확인이 필요한 돌봄 항목이 없습니다.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function MetricTile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "neutral" | "warning" | "success" }) {
  const border = tone === "warning" ? "border-l-amber-400" : tone === "success" ? "border-l-green-400" : "border-l-slate-300";
  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 ${border} bg-white px-4 py-3`}>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function ReportWorkStatusBadge({ status }: { status: "draft" | "submitted" | "locked" | "missing" }) {
  if (status === "missing") return <Badge tone="warning" marker="!" srLabel="이번 주 리포트 상태">작성 필요</Badge>;
  return <ReportStatusBadge status={status} />;
}
