/** A conservative parser for text copied from a bank transaction table. */
export type BankStatementRow = {
  date: string;
  time: string;
  description: string;
  withdrawal: number;
  deposit: number;
  details: string;
};

export type BankStatementParseResult = {
  rows: BankStatementRow[];
  invalidRows: { rowNumber: number; reason: string }[];
};

export function parseBankStatement(text: string): BankStatementParseResult {
  const rows: BankStatementRow[] = [];
  const invalidRows: BankStatementParseResult["invalidRows"] = [];
  // Detect date-shaped row starts even when their time is missing, so a bad row is not silently skipped.
  const starts = [...text.matchAll(/(?:^|\s)(\d{8})(?=\s|$)/g)];
  starts.forEach((match, index) => {
    const rowNumber = index + 1;
    const date = match[1];
    const content = text.slice(match.index! + match[0].length, starts[index + 1]?.index ?? text.length)
      .replace(/\s+/g, " ").trim();
    const timeMatch = content.match(/^(\d{2}:\d{2}:\d{2})(?:\s+|$)/);
    const time = timeMatch?.[1] ?? "";
    const body = timeMatch ? content.slice(timeMatch[0].length) : "";
    const amounts = body.match(/^(.*?)\s+(\d{1,3}(?:,\d{3})+|\d+)\s+(\d{1,3}(?:,\d{3})+|\d+)\s+(.+)$/);
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(4, 6));
    const day = Number(date.slice(6, 8));
    const calendarDate = new Date(Date.UTC(year, month - 1, day));
    const validDate = calendarDate.getUTCFullYear() === year && calendarDate.getUTCMonth() === month - 1 && calendarDate.getUTCDate() === day;
    const [hour, minute, second] = time.split(":").map(Number);
    if (!timeMatch || !amounts || !validDate || hour > 23 || minute > 59 || second > 59) {
      invalidRows.push({ rowNumber, reason: "날짜, 시간 또는 금액을 확인해 주세요." });
      return;
    }
    const withdrawal = Number(amounts[2].replaceAll(",", ""));
    const deposit = Number(amounts[3].replaceAll(",", ""));
    if (!Number.isSafeInteger(withdrawal) || !Number.isSafeInteger(deposit) || (withdrawal > 0) === (deposit > 0)) {
      invalidRows.push({ rowNumber, reason: "입금과 출금 중 하나의 금액만 있어야 합니다." });
      return;
    }
    // Balance and branch are not needed for classification or storage.
    const balanceMarker = amounts[4].search(/\s+\*{3,}/);
    if (balanceMarker < 0) {
      invalidRows.push({ rowNumber, reason: "잔액 마스킹을 찾을 수 없습니다. 거래 형식을 확인해 주세요." });
      return;
    }
    const details = amounts[4].slice(0, balanceMarker).trim();
    if (!details) {
      invalidRows.push({ rowNumber, reason: "거래 내용을 확인해 주세요." });
      return;
    }
    rows.push({ date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`, time, description: amounts[1].trim(), withdrawal, deposit, details });
  });
  return { rows, invalidRows };
}
