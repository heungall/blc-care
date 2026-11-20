export type OfferingAccount = {
  id: string;
  name: string;
  purpose: string;
};

export type ConfirmedOffering = {
  accountId: string;
  memberId: string;
  date: string;
  amount: number;
};

/** Summarizes confirmed offerings only; callers must exclude other transactions. */
export function summarizeMemberOfferingsByAccount(
  accounts: OfferingAccount[],
  offerings: ConfirmedOffering[],
  memberId: string,
  year: number,
) {
  const totals = new Map<string, number>();
  for (const offering of offerings) {
    if (offering.memberId !== memberId || !offering.date.startsWith(`${year}-`)) continue;
    if (!Number.isSafeInteger(offering.amount) || offering.amount <= 0) {
      throw new Error("헌금 금액은 양의 정수여야 합니다.");
    }
    const next = (totals.get(offering.accountId) ?? 0) + offering.amount;
    if (!Number.isSafeInteger(next)) throw new Error("헌금 합계가 허용 범위를 초과했습니다.");
    totals.set(offering.accountId, next);
  }
  const knownIds = new Set(accounts.map((account) => account.id));
  if (knownIds.size !== accounts.length || [...totals.keys()].some((id) => !knownIds.has(id))) {
    throw new Error("헌금 계좌 정보를 확인해 주세요.");
  }
  const byAccount = accounts.map((account) => ({ ...account, amount: totals.get(account.id) ?? 0 }));
  const total = byAccount.reduce((sum, account) => sum + account.amount, 0);
  if (!Number.isSafeInteger(total)) throw new Error("헌금 합계가 허용 범위를 초과했습니다.");
  return { year, memberId, total, byAccount };
}
