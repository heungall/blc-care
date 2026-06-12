import { PageHeader } from "@/components/page-header";
import { ReportForm } from "@/components/report-form";

export default function NewReportPage() {
  return (
    <>
      <PageHeader title="이번 주 리포트 작성" description="나눔과 기도제목 자동 분리 결과는 확인 후에만 인원별 입력에 반영됩니다." />
      <ReportForm />
    </>
  );
}
