import { describe, expect, it } from "vitest";
import { parseBankStatement } from "@/lib/bank-statement-parser";

describe("bank statement parser", () => {
  it("extracts wrapped deposits and withdrawals without balance or branch", () => {
    const result = parseBankStatement(`거래일자 거래시간 적요 출금 입금 내용 잔액 거래점
20260103 12:09:18 타행모바일
뱅킹 0 25,000 홍길동 ********** (샘플)
20260102 19:23:11 이체 30,000 0 샘플 지출 ********** 샘플점`);
    expect(result.invalidRows).toEqual([]);
    expect(result.rows).toEqual([
      { date: "2026-01-03", time: "12:09:18", description: "타행모바일 뱅킹", withdrawal: 0, deposit: 25000, details: "홍길동" },
      { date: "2026-01-02", time: "19:23:11", description: "이체", withdrawal: 30000, deposit: 0, details: "샘플 지출" },
    ]);
  });

  it("flags invalid dates and impossible amounts without returning raw text", () => {
    const result = parseBankStatement(`20260230 12:00:00 이체 0 100 샘플
20260101 12:00:00 이체 100 200 샘플`);
    expect(result.rows).toEqual([]);
    expect(result.invalidRows.map((row) => row.rowNumber)).toEqual([1, 2]);
  });
});
