"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { parseBankStatement, type BankStatementRow } from "@/lib/bank-statement-parser";
import { offeringApi, type Account, type NewOfferingTransaction, type OfferingImportBatch, type OfferingMember, type OfferingTransaction, type OfferingUser, type TransactionCategory } from "@/lib/offering-api";

type Draft = BankStatementRow & { key: string; category: "" | TransactionCategory; memberId: string; purpose: string };
const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
const inputClass = "mt-1";

function duplicateKey(row: Pick<OfferingTransaction, "account_id" | "transaction_date" | "transaction_time" | "withdrawal" | "deposit" | "details">) {
  return JSON.stringify([row.account_id, row.transaction_date, row.transaction_time.slice(0, 8), row.withdrawal, row.deposit, row.details]);
}

export default function OfferingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<OfferingMember[]>([]);
  const [transactions, setTransactions] = useState<OfferingTransaction[]>([]);
  const [batches, setBatches] = useState<OfferingImportBatch[]>([]);
  const [users, setUsers] = useState<OfferingUser[]>([]);
  const [accountId, setAccountId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountPurpose, setAccountPurpose] = useState("");
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [month, setMonth] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }));
  const [year, setYear] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul", year: "numeric" }));
  const [memberId, setMemberId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<OfferingTransaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const load = useCallback(async () => {
    const [nextAccounts, nextMembers, nextTransactions, nextBatches, nextUsers] = await Promise.all([offeringApi.accounts(), offeringApi.members(), offeringApi.transactions(), offeringApi.batches(), offeringApi.users()]);
    setAccounts(nextAccounts); setMembers(nextMembers); setTransactions(nextTransactions);
    setBatches(nextBatches); setUsers(nextUsers);
    setAccountId((current) => current || nextAccounts[0]?.id || "");
  }, []);
  useEffect(() => { void load().catch(() => setMessage("정보를 불러오지 못했습니다. 데이터베이스 설정과 관리자 권한을 확인해 주세요.")).finally(() => setLoading(false)); }, [load]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setMessage("");
    try { await action(); await load(); setMessage(success); }
    catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      setMessage(code === "23505" ? "이미 저장된 거래와 같은 항목이 있습니다. 거래를 확인하고 제외해 주세요." : "저장하지 못했습니다. 입력값과 관리자 권한을 확인한 뒤 다시 시도해 주세요.");
    } finally { setBusy(false); }
  };

  const parse = () => {
    const result = parseBankStatement(text);
    setInvalid(result.invalidRows.map((row) => `${row.rowNumber}번째 거래: ${row.reason}`));
    setDrafts(result.rows.map((row, index) => ({ ...row, key: `${index}`, category: "", memberId: "", purpose: "" })));
    setMessage(result.rows.length || result.invalidRows.length ? "거래를 확인하고 종류를 선택해 주세요." : "거래를 찾지 못했습니다. 복사한 형식을 확인해 주세요.");
  };
  const setDraft = (key: string, patch: Partial<Draft>) => setDrafts((rows) => rows.map((row) => row.key === key ? { ...row, ...patch } : row));
  const asTransaction = (row: Draft): NewOfferingTransaction => ({ account_id: accountId, transaction_date: row.date, transaction_time: row.time, description: row.description, details: row.details, withdrawal: row.withdrawal, deposit: row.deposit, category: row.category as TransactionCategory, member_id: row.category === "offering" ? row.memberId : null, purpose: row.purpose.trim() });
  const savedKeys = useMemo(() => new Set(transactions.map(duplicateKey)), [transactions]);
  const batchKeys = drafts.map((row) => duplicateKey(asTransaction(row)));
  const isDuplicate = (index: number) => savedKeys.has(batchKeys[index]) || batchKeys.indexOf(batchKeys[index]) !== index;
  const isValid = (row: Draft) => row.category && (row.category === "offering" ? !!row.memberId : !!row.purpose.trim());
  const canSave = !!accountId && drafts.length > 0 && drafts.length <= 500 && !invalid.length && drafts.every((row, index) => isValid(row) && !isDuplicate(index));
  const monthly = transactions.filter((row) => row.transaction_date.startsWith(month)).sort((a, b) => `${b.transaction_date}${b.transaction_time}`.localeCompare(`${a.transaction_date}${a.transaction_time}`));
  const annual = transactions.filter((row) => row.category === "offering" && row.member_id === memberId && row.transaction_date.startsWith(`${year}-`));
  const memberOptions = [...members].sort((a, b) => a.display_name.localeCompare(b.display_name, "ko"));
  const memberName = (id: string | null) => members.find((member) => member.member_id === id)?.display_name ?? "성도 선택";
  const accountLabel = (id: string) => { const account = accounts.find((item) => item.id === id); return account ? `${account.name} · ${account.purpose}` : "계좌 정보 없음"; };
  const userName = (id: string | null) => users.find((user) => user.user_id === id)?.name ?? "알 수 없음";
  const displayTime = (date: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
  const MemberSelect = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <Select value={value} onChange={(event) => onChange(event.target.value)}><option value="">성도 선택</option>{memberOptions.map((member) => <option key={member.member_id} value={member.member_id}>{member.display_name} ({member.full_name})</option>)}</Select>;

  return <>
    <PageHeader title="헌금 정리" description="계좌별 거래를 확인하고 헌금과 지출을 정리합니다." />
    {message && <div role="status" className="mb-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{message}</div>}
    {loading ? <Card>불러오는 중입니다.</Card> : <div className="space-y-5">
      <Card><h2 className="text-lg font-bold">계좌 관리</h2><p className="mt-1 text-sm text-slate-500">계좌번호 대신 구분할 이름과 용도를 입력해 주세요.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input aria-label="새 계좌 이름" placeholder="계좌 이름" value={accountName} onChange={(e) => setAccountName(e.target.value)} /><Input aria-label="새 계좌 용도" placeholder="용도 (예: 일반 헌금)" value={accountPurpose} onChange={(e) => setAccountPurpose(e.target.value)} /><Button disabled={busy || !accountName.trim() || !accountPurpose.trim()} onClick={() => void run(async () => { await offeringApi.createAccount(accountName.trim(), accountPurpose.trim()); setAccountName(""); setAccountPurpose(""); }, "계좌를 추가했습니다.")}>계좌 추가</Button></div>
        <div className="mt-4 space-y-2">{accounts.map((account) => <div key={account.id} className="rounded-xl bg-slate-50 p-3">{editingAccount?.id === account.id ? <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"><Input aria-label="계좌 이름 수정" value={editingAccount.name} onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })} /><Input aria-label="계좌 용도 수정" value={editingAccount.purpose} onChange={(e) => setEditingAccount({ ...editingAccount, purpose: e.target.value })} /><Button disabled={busy || !editingAccount.name.trim() || !editingAccount.purpose.trim()} onClick={() => void run(async () => { await offeringApi.updateAccount(account.id, editingAccount.name.trim(), editingAccount.purpose.trim()); setEditingAccount(null); }, "계좌 정보를 수정했습니다.")}>저장</Button><Button variant="secondary" onClick={() => setEditingAccount(null)}>취소</Button></div> : <div className="flex items-center justify-between gap-2 text-sm"><span><strong>{account.name}</strong> · {account.purpose}</span><Button variant="ghost" onClick={() => setEditingAccount(account)}>수정</Button></div>}</div>)}</div>
      </Card>
      <Card><h2 className="text-lg font-bold">거래 내역 가져오기</h2><p className="mt-1 text-sm text-slate-500">PDF에서 표를 복사해 붙여넣고 각 거래를 확인해 주세요. 현재 잔액이 별표로 가려진 형식을 지원합니다.</p>
        <label className="mt-4 block text-sm font-semibold">대상 계좌<Select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">계좌 선택</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.purpose}</option>)}</Select></label>
        <label className="mt-4 block text-sm font-semibold">복사한 거래 내역<Textarea className={inputClass} rows={6} value={text} onChange={(e) => { setText(e.target.value); setDrafts([]); setInvalid([]); }} placeholder="거래 표를 여기에 붙여넣으세요" /></label>
        <Button className="mt-3" variant="secondary" disabled={!text.trim() || !accountId} onClick={parse}>거래 분리하기</Button>
        {invalid.length > 0 && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-bold">분리하지 못한 거래가 있습니다. 원문을 확인하고 다시 분리해 주세요.</p>{invalid.map((item, index) => <p key={index}>{item}</p>)}</div>}
        <div className="mt-4 space-y-3">{drafts.map((row, index) => {
          const candidates = members.filter((member) => member.full_name === row.details || member.display_name === row.details || member.name_aliases.includes(row.details));
          return <div key={row.key} className={`rounded-xl border p-4 ${!isValid(row) || isDuplicate(index) ? "border-rose-200 bg-rose-50/50" : "border-slate-200"}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><strong>{row.details}</strong> <span className="text-sm text-slate-500">{row.date} {row.time} · {row.description}</span><p className="mt-1 font-semibold">{row.deposit ? `입금 ${won(row.deposit)}` : `출금 ${won(row.withdrawal)}`}</p></div><div className="flex items-center gap-2">{isDuplicate(index) ? <Badge tone="danger">중복 확인</Badge> : !isValid(row) ? <Badge tone="danger">확인 필요</Badge> : <Badge tone="success">확인 완료</Badge>}<Button variant="ghost" onClick={() => setDrafts((items) => items.filter((item) => item.key !== row.key))}>제외</Button></div></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">거래 종류<Select className={inputClass} value={row.category} onChange={(e) => setDraft(row.key, { category: e.target.value as Draft["category"], memberId: "" })}><option value="">선택해 주세요</option>{row.deposit > 0 ? <><option value="offering">헌금</option><option value="other_income">기타 입금</option></> : <option value="expense">지출</option>}</Select></label>
            {row.category === "offering" ? <label className="text-sm font-semibold">헌금 성도<div className={inputClass}><MemberSelect value={row.memberId} onChange={(value) => setDraft(row.key, { memberId: value })} /></div>{candidates.length === 1 && !row.memberId && <button className="mt-1 text-xs text-blue-700 underline" onClick={() => setDraft(row.key, { memberId: candidates[0].member_id })}>이름이 일치하는 {candidates[0].display_name} 선택</button>}{candidates.length > 1 && <span className="block text-xs text-rose-700">같은 이름이 여러 명입니다. 직접 확인해 주세요.</span>}</label> : <label className="text-sm font-semibold">용도·명목<Input className={inputClass} value={row.purpose} onChange={(e) => setDraft(row.key, { purpose: e.target.value })} placeholder="예: 환불, 물품 구입" /></label>}</div></div>;
        })}</div>
        {drafts.length > 0 && <div className="mt-4"><p className="mb-2 text-sm text-slate-500">모든 거래의 종류와 성도 또는 용도를 확인한 뒤 저장합니다. 중복 항목은 제외해 주세요. 한 번에 최대 500건을 저장할 수 있습니다.</p><Button disabled={!canSave || busy} onClick={() => void run(async () => { await offeringApi.saveTransactions(drafts.map(asTransaction)); setDrafts([]); setText(""); }, "확인한 거래를 저장했습니다.")}>확인한 {drafts.length}건 저장</Button></div>}
      </Card>
      <Card><h2 className="text-lg font-bold">등록 내역</h2><p className="mt-1 text-sm text-slate-500">거래를 저장할 때마다 계좌와 등록 일시가 기록됩니다. 잘못 등록한 건 전체를 삭제할 수 있습니다.</p>
        <div className="mt-4 space-y-2">{batches.length === 0 && <p className="text-sm text-slate-500">등록 내역이 없습니다.</p>}{[...batches].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((batch) => <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm"><div><strong>{accountLabel(batch.account_id)}</strong> {batch.deleted_at && <Badge tone="neutral">삭제됨</Badge>}<p className="mt-1">등록 {displayTime(batch.created_at)} · {userName(batch.created_by)} · {batch.transaction_count}건</p><p className="mt-1 text-slate-500">거래 기간 {batch.first_date} ~ {batch.last_date}</p>{batch.deleted_at && <p className="mt-1 text-slate-500">삭제 {displayTime(batch.deleted_at)} · {userName(batch.deleted_by)}</p>}</div>{!batch.deleted_at && <Button variant="secondary" disabled={busy} onClick={() => { if (window.confirm(`${accountLabel(batch.account_id)}의 등록 내역 ${batch.transaction_count}건을 모두 삭제할까요? 삭제한 거래는 월별 내역과 헌금 합계에서 빠지며 복구할 수 없습니다.`)) void run(() => offeringApi.deleteBatch(batch.id), "등록 내역을 삭제했습니다."); }}>이 등록 건 삭제</Button>}</div>)}</div>
      </Card>
      <Card><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">월별 거래</h2><p className="mt-1 text-sm text-slate-500">계좌별로 입금과 지출을 확인합니다.</p></div><label className="text-sm font-semibold">조회 월<Input className={inputClass} type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{accounts.map((account) => { const rows = monthly.filter((row) => row.account_id === account.id); return <div key={account.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{account.name} · {account.purpose}</strong><p className="mt-1">입금 {won(rows.reduce((sum, row) => sum + Number(row.deposit), 0))} / 지출 {won(rows.reduce((sum, row) => sum + Number(row.withdrawal), 0))}</p></div>; })}</div>
        <div className="mt-4 space-y-2">{monthly.length === 0 && <p className="text-sm text-slate-500">이 달에 저장된 거래가 없습니다.</p>}{monthly.map((row) => <div key={row.id} className="rounded-xl border border-slate-200 p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong>{row.details}</strong> · {row.transaction_date} · {accountLabel(row.account_id)}<p className="mt-1">{row.deposit ? `입금 ${won(Number(row.deposit))}` : `지출 ${won(Number(row.withdrawal))}`} · {row.category === "offering" ? `헌금 / ${memberName(row.member_id)}` : `${row.category === "expense" ? "지출" : "기타 입금"} / ${row.purpose}`}</p></div><Button variant="ghost" onClick={() => setEditing(row)}>분류 수정</Button></div>
          {editing?.id === row.id && <div className="mt-3 grid gap-2 sm:grid-cols-3"><Select aria-label="거래 종류 수정" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as TransactionCategory, member_id: null })}>{row.deposit > 0 ? <><option value="offering">헌금</option><option value="other_income">기타 입금</option></> : <option value="expense">지출</option>}</Select>{editing.category === "offering" ? <MemberSelect value={editing.member_id ?? ""} onChange={(value) => setEditing({ ...editing, member_id: value })} /> : <Input aria-label="용도 수정" value={editing.purpose} onChange={(e) => setEditing({ ...editing, purpose: e.target.value })} placeholder="용도·명목" />}<div className="flex gap-2"><Button disabled={busy || (editing.category === "offering" ? !editing.member_id : !editing.purpose.trim())} onClick={() => void run(async () => { await offeringApi.updateTransaction(editing.id, editing.category, editing.category === "offering" ? editing.member_id : null, editing.purpose.trim()); setEditing(null); }, "거래 분류를 수정했습니다.")}>저장</Button><Button variant="secondary" onClick={() => setEditing(null)}>취소</Button></div></div>}</div>)}</div>
      </Card>
      <Card><h2 className="text-lg font-bold">성도별 연간 헌금</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">연도<Input className={inputClass} type="number" min="1900" max="9999" value={year} onChange={(e) => setYear(e.target.value)} /></label><label className="text-sm font-semibold">성도<div className={inputClass}><MemberSelect value={memberId} onChange={setMemberId} /></div></label></div>
        {memberId && <div className="mt-4"><p className="text-lg font-bold">전체 {won(annual.reduce((sum, row) => sum + Number(row.deposit), 0))}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{accounts.map((account) => <div key={account.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{account.name} · {account.purpose}</strong><p className="mt-1">{won(annual.filter((row) => row.account_id === account.id).reduce((sum, row) => sum + Number(row.deposit), 0))}</p></div>)}</div><div className="mt-4 space-y-1 text-sm text-slate-600">{annual.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).map((row) => <p key={row.id}>{row.transaction_date} · {accountLabel(row.account_id)} · {won(Number(row.deposit))}</p>)}</div></div>}
      </Card>
    </div>}
  </>;
}
