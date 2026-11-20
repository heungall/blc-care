import { describe, expect, it } from "vitest";
import { summarizeMemberOfferingsByAccount } from "@/lib/offering-summary";

describe("summarizeMemberOfferingsByAccount", () => {
  const accounts = [
    { id: "a", name: "계좌 1", purpose: "일반 헌금" },
    { id: "b", name: "계좌 2", purpose: "공간헌금" },
    { id: "c", name: "계좌 3", purpose: "기타" },
  ];
  it("summarizes a member and year across any number of accounts", () => {
    const result = summarizeMemberOfferingsByAccount(accounts, [
      { accountId: "a", memberId: "m", date: "2026-01-01", amount: 10000 },
      { accountId: "b", memberId: "m", date: "2026-02-01", amount: 20000 },
      { accountId: "a", memberId: "other", date: "2026-01-01", amount: 40000 },
      { accountId: "a", memberId: "m", date: "2025-01-01", amount: 50000 },
    ], "m", 2026);
    expect(result.total).toBe(30000);
    expect(result.byAccount.map((account) => account.amount)).toEqual([10000, 20000, 0]);
  });
  it("rejects offerings whose account is missing instead of silently losing them", () => {
    expect(() => summarizeMemberOfferingsByAccount(accounts, [
      { accountId: "missing", memberId: "m", date: "2026-01-01", amount: 1 },
    ], "m", 2026)).toThrow();
  });
});
