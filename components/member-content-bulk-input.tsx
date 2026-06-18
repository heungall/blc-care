"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, Textarea } from "@/components/ui";
import { parseMemberContentText } from "@/lib/member-content-parser";
import type { Member, MemberContentParseResult } from "@/lib/types";

const EMPTY_RESULT: MemberContentParseResult = {
  items: [],
  ambiguous: [],
  unmatched: [],
  invalid: [],
};

export function MemberContentBulkInput({
  members,
  contentLabel,
  placeholder,
  onConfirm,
}: {
  members: Member[];
  contentLabel: "나눔" | "기도제목";
  placeholder: string;
  onConfirm: (contents: Record<string, string>) => void;
}) {
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<MemberContentParseResult>(EMPTY_RESULT);
  const [confirmed, setConfirmed] = useState(false);
  const total = useMemo(
    () => result.items.length + result.ambiguous.length + result.unmatched.length + result.invalid.length,
    [result],
  );
  const requiresReview = result.ambiguous.length + result.unmatched.length + result.invalid.length;

  const parse = () => {
    setResult(parseMemberContentText(rawText, members));
    setConfirmed(false);
  };

  const confirm = () => {
    onConfirm(Object.fromEntries(result.items.map((item) => [item.member_id, item.content])));
    setConfirmed(true);
  };

  return (
    <Card variant="input">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{contentLabel} 일괄 입력</h2>
          <p className="mt-1 text-sm text-slate-500">
            선택된 셀 인원 안에서만 로컬 규칙으로 이름을 찾습니다.
          </p>
        </div>
        <Badge tone="neutral">외부 AI 전송 없음</Badge>
      </div>

      <Textarea
        className="mt-4 min-h-40"
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        placeholder={placeholder}
        aria-label={`${contentLabel} 일괄 입력`}
      />
      <Button className="mt-3 w-full sm:w-auto" type="button" onClick={parse} disabled={!rawText.trim()}>
        사람별 자동 분리
      </Button>

      {total > 0 && (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <p className="text-sm font-semibold">
            총 {total}건 중 {result.items.length}건 자동 매칭, {requiresReview}건 확인 필요
          </p>
          <div className="mt-3 space-y-3">
            {result.items.map((item) => (
              <div key={item.member_id} className="rounded-xl bg-green-50 p-4">
                <Badge tone="success">자동 매칭</Badge>
                <p className="mt-2 text-sm font-semibold">{item.input_name} → {item.matched_name}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{item.content}</p>
              </div>
            ))}
            {result.ambiguous.map((item, index) => (
              <div key={`ambiguous-${index}`} className="rounded-xl bg-amber-50 p-4">
                <Badge tone="warning">후보 선택 필요</Badge>
                <p className="mt-2 text-sm">
                  {item.input_name}: {item.candidates.map((candidate) => candidate.display_name).join(", ")}
                </p>
              </div>
            ))}
            {result.unmatched.map((item, index) => (
              <div key={`unmatched-${index}`} className="rounded-xl bg-slate-100 p-4">
                <Badge>미매칭</Badge>
                <p className="mt-2 text-sm">{item.input_name}: 선택된 셀에서 찾을 수 없습니다.</p>
              </div>
            ))}
            {result.invalid.map((item, index) => (
              <div key={`invalid-${index}`} className="rounded-xl bg-rose-50 p-4">
                <Badge tone="danger">형식 확인</Badge>
                <p className="mt-2 text-sm">{item.raw_line} · {item.reason}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              자동 분리 결과는 아직 저장되지 않았습니다. 내용을 확인한 뒤 자동 매칭 항목을 개인별 입력에 반영하세요.
            </p>
            <Button className="mt-3 w-full sm:w-auto" type="button" onClick={confirm} disabled={result.items.length === 0}>
              확인하고 {contentLabel} 입력에 반영
            </Button>
            {confirmed && (
              <p className="mt-2 text-sm font-semibold text-green-700">
                확인한 항목을 개인별 {contentLabel} 입력에 반영했습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
