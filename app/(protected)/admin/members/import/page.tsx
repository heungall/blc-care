"use client";

import { useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, EmptyState, ErrorState } from "@/components/ui";
import {
  createMemberCsvTemplate,
  MEMBER_CSV_MAX_BYTES,
  MEMBER_CSV_MAX_ROWS,
  parseMemberCsv,
  type MemberCsvParseResult,
} from "@/lib/member-csv";

type ImportApiResponse = {
  success: boolean;
  data: { imported_count: number } | null;
  error: {
    message: string;
    details?: Array<{ row: number; message: string }>;
  } | null;
};

export default function AdminMemberImportPage() {
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverDetails, setServerDetails] = useState<Array<{ row: number; message: string }>>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const parsed = useMemo<MemberCsvParseResult | null>(() => csvText ? parseMemberCsv(csvText) : null, [csvText]);

  const selectFile = async (file?: File) => {
    setServerError("");
    setServerDetails([]);
    setImportedCount(null);
    setConfirmed(false);
    if (!file) {
      setFileName("");
      setCsvText("");
      return;
    }
    if (file.size > MEMBER_CSV_MAX_BYTES) {
      setFileName(file.name);
      setCsvText("");
      setServerError("CSV 파일은 최대 1MB까지 등록할 수 있습니다.");
      return;
    }
    setFileName(file.name);
    setCsvText(await file.text());
  };

  const importMembers = async () => {
    if (!parsed || parsed.errors.length || !confirmed) return;
    setSubmitting(true);
    setServerError("");
    setServerDetails([]);
    setImportedCount(null);
    try {
      const response = await fetch("/api/admin/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_text: csvText }),
      });
      const payload = await response.json() as ImportApiResponse;
      if (!response.ok || !payload.success || !payload.data) {
        setServerError(payload.error?.message ?? "성도 일괄 등록에 실패했습니다.");
        setServerDetails(payload.error?.details ?? []);
        return;
      }
      setImportedCount(payload.data.imported_count);
      setConfirmed(false);
    } catch {
      setServerError("서버에 연결하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <PageHeader
        title="성도 CSV 일괄 등록"
        description="CSV 전체를 검증한 뒤 Supabase에 한 번에 등록합니다. 오류가 있으면 아무 행도 저장하지 않습니다."
        action={<Button type="button" variant="secondary" onClick={downloadTemplate}>CSV 템플릿 다운로드</Button>}
      />

      <Card>
        <h2 className="font-bold">CSV 파일 선택</h2>
        <p className="mt-2 text-sm text-slate-500">
          최대 {MEMBER_CSV_MAX_ROWS}명, 1MB까지 등록할 수 있습니다. 셀 이름은 Admin 셀 관리 화면의 활성 셀 이름과 같아야 합니다.
        </p>
        <label className="mt-4 block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm">
          <span className="font-semibold">성도 CSV 파일</span>
          <input
            className="mt-3 block w-full text-sm"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => void selectFile(event.target.files?.[0])}
          />
        </label>
        {fileName && <p className="mt-3 text-xs text-slate-500">선택 파일: {fileName}</p>}
      </Card>

      {serverError && <ErrorState>{serverError}</ErrorState>}
      {serverDetails.length > 0 && <ValidationErrors errors={serverDetails} />}
      {importedCount !== null && (
        <Card className="border-green-200 bg-green-50">
          <p className="font-bold text-green-800">성도 {importedCount}명을 등록했습니다.</p>
        </Card>
      )}

      {!parsed && <EmptyState>CSV 템플릿을 내려받아 작성한 뒤 파일을 선택해주세요.</EmptyState>}
      {parsed && parsed.errors.length > 0 && <ValidationErrors errors={parsed.errors} />}
      {parsed && parsed.errors.length === 0 && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">등록 전 확인</h2>
                <p className="mt-1 text-sm text-slate-500">민감정보는 미리보기에 표시하지 않습니다.</p>
              </div>
              <Badge tone="primary">{parsed.rows.length}명</Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500">
                  <tr><th className="px-3 py-2">행</th><th className="px-3 py-2">표시 이름</th><th className="px-3 py-2">셀</th><th className="px-3 py-2">상태</th><th className="px-3 py-2">별칭 수</th></tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 50).map((row, index) => (
                    <tr key={`${index}-${row.full_name}`} className="border-b border-slate-100">
                      <td className="px-3 py-3 text-slate-500">{index + 2}</td>
                      <td className="px-3 py-3 font-semibold">{row.display_name}</td>
                      <td className="px-3 py-3">{row.cell_name || "미배정"}</td>
                      <td className="px-3 py-3"><Badge tone={row.status === "active" ? "success" : "neutral"}>{row.status}</Badge></td>
                      <td className="px-3 py-3">{row.name_aliases.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > 50 && <p className="mt-3 text-xs text-slate-500">앞의 50명만 미리보기로 표시합니다.</p>}
          </Card>

          <Card>
            <label className="flex items-start gap-3 text-sm">
              <input className="mt-1" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>
                <strong>CSV 내용을 확인했습니다.</strong>
                <span className="mt-1 block text-slate-500">등록 후에는 자동 취소되지 않습니다. 오류가 있으면 전체 등록이 취소됩니다.</span>
              </span>
            </label>
            <Button
              type="button"
              className="mt-5 w-full"
              disabled={!confirmed || submitting}
              onClick={() => void importMembers()}
            >
              {submitting ? "등록 중..." : `${parsed.rows.length}명 일괄 등록`}
            </Button>
          </Card>
        </>
      )}
    </AdminGuard>
  );
}

function ValidationErrors({ errors }: { errors: Array<{ row: number; message: string }> }) {
  return (
    <Card className="border-rose-200 bg-rose-50">
      <h2 className="font-bold text-rose-800">CSV 오류 {errors.length}건</h2>
      <ul className="mt-3 space-y-2 text-sm text-rose-800">
        {errors.slice(0, 20).map((error, index) => <li key={`${error.row}-${index}`}>{error.row}행: {error.message}</li>)}
      </ul>
      {errors.length > 20 && <p className="mt-3 text-xs text-rose-700">앞의 20건만 표시합니다.</p>}
    </Card>
  );
}

function downloadTemplate() {
  const blob = new Blob([`\uFEFF${createMemberCsvTemplate()}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "blc-care-members-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
