"use client";

import { useState } from "react";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { api, getApiErrorMessage, type UpdateMemberPayload } from "@/lib/api";
import type { DataScope } from "@/lib/data-scope";
import type { Cell, Member, User } from "@/lib/types";

export function MemberEditForm({
  user,
  member,
  cells,
  scope,
  onCancel,
  onSaved,
}: {
  user: User;
  member: Member;
  cells: Cell[];
  scope?: DataScope;
  onCancel: () => void;
  onSaved: (member: Member & { current_cell_name?: string }) => void;
}) {
  const isAdmin = user.roles.includes("admin") && scope !== "leader";
  const [values, setValues] = useState<UpdateMemberPayload>({
    member_id: member.member_id,
    full_name: member.full_name,
    display_name: member.display_name,
    name_aliases: member.name_aliases,
    phone: member.phone ?? "",
    birth_date: member.birth_date ?? "",
    age: member.age,
    first_visit_date: member.first_visit_date ?? "",
    registration_date: member.registration_date ?? "",
    address: member.address ?? "",
    workplace: member.workplace ?? "",
    occupation: member.occupation ?? "",
    job_title: member.job_title ?? "",
    faith_start_year: member.faith_start_year,
    bible_study_status: member.bible_study_status,
    baptism_status: member.baptism_status,
    family_info: member.family_info ?? "",
    memo: member.memo ?? "",
    current_cell_id: member.current_cell_id,
    status: member.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof UpdateMemberPayload>(key: K, value: UpdateMemberPayload[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      onSaved(await api.updateMember(user, values, { scope }));
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-lg font-bold">기본 정보 수정</h2>
        <p className="mt-1 text-sm text-slate-500">돌봄에 필요한 범위에서만 정확한 정보를 입력해주세요.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="이름" required><Input value={values.full_name} onChange={(event) => update("full_name", event.target.value)} /></Field>
          <Field label="표시 이름" required><Input value={values.display_name} onChange={(event) => update("display_name", event.target.value)} /></Field>
          <Field label="이름 별칭"><Input value={values.name_aliases.join(", ")} onChange={(event) => update("name_aliases", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="쉼표로 구분" /></Field>
          <Field label="연락처"><Input value={values.phone ?? ""} onChange={(event) => update("phone", event.target.value)} inputMode="tel" /></Field>
          <Field label="생년월일"><Input type="date" value={values.birth_date ?? ""} onChange={(event) => update("birth_date", event.target.value)} /></Field>
          <Field label="나이"><Input type="number" min={0} max={150} value={values.age ?? ""} onChange={(event) => update("age", event.target.value ? Number(event.target.value) : undefined)} /></Field>
          <Field label="첫 방문일"><Input type="date" value={values.first_visit_date ?? ""} onChange={(event) => update("first_visit_date", event.target.value)} /></Field>
          <Field label="등록일"><Input type="date" value={values.registration_date ?? ""} onChange={(event) => update("registration_date", event.target.value)} /></Field>
          <Field label="주소"><Input value={values.address ?? ""} onChange={(event) => update("address", event.target.value)} /></Field>
          <Field label="직장"><Input value={values.workplace ?? ""} onChange={(event) => update("workplace", event.target.value)} /></Field>
          <Field label="직업"><Input value={values.occupation ?? ""} onChange={(event) => update("occupation", event.target.value)} /></Field>
          <Field label="직책"><Input value={values.job_title ?? ""} onChange={(event) => update("job_title", event.target.value)} /></Field>
          <Field label="신앙 시작 연도"><Input type="number" min={1000} max={9999} value={values.faith_start_year ?? ""} onChange={(event) => update("faith_start_year", event.target.value || undefined)} /></Field>
          <Field label="성경공부 상태">
            <Select value={values.bible_study_status ?? ""} onChange={(event) => update("bible_study_status", event.target.value as Member["bible_study_status"])}>
              <option value="">미입력</option><option value="unknown">미확인</option><option value="not_started">시작 전</option><option value="in_progress">진행 중</option><option value="completed">완료</option>
            </Select>
          </Field>
          <Field label="세례 상태">
            <Select value={values.baptism_status ?? ""} onChange={(event) => update("baptism_status", event.target.value as Member["baptism_status"])}>
              <option value="">미입력</option><option value="unknown">미확인</option><option value="not_baptized">미세례</option><option value="baptized">세례</option><option value="infant_baptized">유아세례</option><option value="confirmation">입교</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="가족 정보"><Textarea className="min-h-20" value={values.family_info ?? ""} onChange={(event) => update("family_info", event.target.value)} /></Field>
          <Field label="관리 메모"><Textarea className="min-h-20" value={values.memo ?? ""} onChange={(event) => update("memo", event.target.value)} /></Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">소속 및 상태</h2>
        {!isAdmin && <p className="mt-1 text-sm text-slate-500">소속 셀과 상태 변경은 Admin만 할 수 있습니다.</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="현재 셀">
            <Select value={values.current_cell_id ?? ""} disabled={!isAdmin} onChange={(event) => update("current_cell_id", event.target.value)}>
              {cells.map((cell) => <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>)}
            </Select>
          </Field>
          <Field label="성도 상태">
            <Select value={values.status ?? "active"} disabled={!isAdmin} onChange={(event) => update("status", event.target.value as Member["status"])}>
              <option value="active">활동</option><option value="dormant">휴면</option><option value="left">이탈</option><option value="archived">보관</option>
            </Select>
          </Field>
        </div>
      </Card>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>취소</Button>
        <Button type="button" onClick={() => void save()} disabled={saving || !values.full_name.trim() || !values.display_name.trim()}>{saving ? "저장 중" : "정보 저장"}</Button>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold">{label}{required && <span className="text-blue-700"> *</span>}<div className="mt-2">{children}</div></label>;
}
