/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getScopedCellIds } from "@/lib/data-scope";
import { getWeekRange } from "@/lib/date";
import { parsePrayerText } from "@/lib/prayer-parser";
import { getCurrentAppUser } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AppSettings, Member, NewcomerFormValues } from "@/lib/types";

export const dynamic = "force-dynamic";

type Body = { action?: string; data?: Record<string, unknown> };
type AppUser = NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>>;

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 262_144) {
      return failure("BAD_REQUEST", "요청 크기가 너무 큽니다.", 413);
    }
    const body = await request.json() as Body;
    if (!body.action) return failure("BAD_REQUEST", "action이 필요합니다.", 400);
    const data = body.data ?? {};
    const admin = createSupabaseAdminClient();

    if (body.action === "createNewcomer") {
      const values = data as NewcomerFormValues;
      if (!values.name?.trim() || !values.phone?.trim() || values.privacy_agreed !== true) {
        return failure("BAD_REQUEST", "필수 입력값과 개인정보 동의를 확인해주세요.", 400);
      }
      const { data: newcomer, error } = await admin.from("newcomers").insert({
        name: values.name.trim(),
        phone: values.phone.trim(),
        address: blankToNull(values.address),
        visit_motivation: blankToNull(values.visit_motivation),
        visit_channel: blankToNull(values.visit_channel),
        faith_experience: blankToNull(values.faith_experience),
        after_service_plan: blankToNull(values.after_service_plan),
        privacy_agreed: true,
      }).select("newcomer_id, status, submitted_at").single();
      return databaseResult(newcomer, error);
    }

    const user = await getCurrentAppUser();
    if (!user) return failure("UNAUTHORIZED", "로그인이 필요합니다.", 401);
    const isAdmin = user.roles.includes("admin");
    const cellIds = getScopedCellIds(user, data.scope);

    switch (body.action) {
      case "verifyUser":
        return success(user);
      case "getCells": {
        let query = admin.from("cells").select("*").order("sort_order").order("cell_name");
        if (cellIds) query = query.in("cell_id", cellIds);
        const result = await query;
        return databaseResult({ items: result.data ?? [] }, result.error);
      }
      case "getMembers":
        return getMembers(admin, cellIds, data);
      case "getMemberDetail":
        return getMemberDetail(admin, cellIds, requiredString(data.member_id, "member_id"));
      case "updateMember":
        return updateMember(admin, user, cellIds, isAdmin, data);
      case "getReports":
        return getReports(admin, cellIds, data);
      case "getReportDetail":
        return getReportDetail(admin, cellIds, requiredString(data.report_id, "report_id"), isAdmin);
      case "getWeeklyReportDraft":
        return getWeeklyReportDraft(admin, user, cellIds, data);
      case "saveWeeklyReport":
        return saveWeeklyReport(admin, user, cellIds, data);
      case "parsePrayerRequests": {
        const cellId = requiredString(data.cell_id, "cell_id");
        assertCellAccess(cellIds, cellId);
        const { data: members, error } = await admin.from("members").select("*").eq("current_cell_id", cellId).eq("status", "active");
        if (error) throw error;
        return success(parsePrayerText(requiredString(data.raw_text, "raw_text"), (members ?? []) as Member[]));
      }
      case "getNewcomers": {
        requireAdmin(isAdmin);
        const result = await admin.from("newcomers").select("*").order("submitted_at", { ascending: false });
        return databaseResult({ items: result.data ?? [] }, result.error);
      }
      case "updateNewcomerStatus": {
        requireAdmin(isAdmin);
        const result = await admin.from("newcomers").update({
          status: requiredString(data.status, "status"),
          admin_memo: blankToNull(data.admin_memo),
        }).eq("newcomer_id", requiredString(data.newcomer_id, "newcomer_id")).select("*").single();
        return databaseResult(result.data, result.error);
      }
      case "convertNewcomerToMember":
        requireAdmin(isAdmin);
        return convertNewcomer(admin, user, data);
      case "getUsers":
        requireAdmin(isAdmin);
        return getUsers(admin);
      case "createUser": {
        requireAdmin(isAdmin);
        const result = await admin.from("users").insert({
          name: requiredString(data.name, "name").trim(),
          email: requiredString(data.email, "email").trim().toLowerCase(),
          roles: data.roles,
          active: data.active !== false,
        }).select("*").single();
        if (result.error) return databaseResult(null, result.error);
        return success({ ...result.data, assigned_cells: [] });
      }
      case "updateUser": {
        requireAdmin(isAdmin);
        const result = await admin.from("users").update({
          name: requiredString(data.name, "name").trim(),
          email: requiredString(data.email, "email").trim().toLowerCase(),
          roles: data.roles,
          active: data.active,
        }).eq("user_id", requiredString(data.user_id, "user_id")).select("*").single();
        if (result.error) return databaseResult(null, result.error);
        const managed = await managedUser(admin, result.data);
        return success(managed);
      }
      case "assignUserToCell": {
        requireAdmin(isAdmin);
        const result = await admin.from("user_cell_assignments").upsert({
          user_id: requiredString(data.user_id, "user_id"),
          cell_id: requiredString(data.cell_id, "cell_id"),
          assignment_role: requiredString(data.assignment_role, "assignment_role"),
          active: true,
          end_date: null,
        }, { onConflict: "user_id,cell_id" }).select("*").single();
        return databaseResult(result.data, result.error);
      }
      case "unassignUserFromCell": {
        requireAdmin(isAdmin);
        const result = await admin.from("user_cell_assignments").update({
          active: false,
          end_date: new Date().toISOString().slice(0, 10),
        }).eq("assignment_id", requiredString(data.assignment_id, "assignment_id")).select("*").single();
        return databaseResult(result.data, result.error);
      }
      case "createCell": {
        requireAdmin(isAdmin);
        const result = await admin.from("cells").insert({ cell_name: requiredString(data.cell_name, "cell_name").trim() }).select("*").single();
        return databaseResult(result.data, result.error);
      }
      case "updateCell": {
        requireAdmin(isAdmin);
        const result = await admin.from("cells").update({
          cell_name: requiredString(data.cell_name, "cell_name").trim(),
          active: data.active,
          sort_order: data.sort_order,
        }).eq("cell_id", requiredString(data.cell_id, "cell_id")).select("*").single();
        return databaseResult(result.data, result.error);
      }
      case "getAbsenceAlerts": {
        let query = admin.from("absence_alerts").select("*").order("created_at", { ascending: false });
        if (!isAdmin) query = query.in("cell_id", cellIds!);
        const result = await query;
        return databaseResult({ items: result.data ?? [] }, result.error);
      }
      case "updateAbsenceAlert": {
        requireAdmin(isAdmin);
        const status = requiredString(data.status, "status");
        const now = new Date().toISOString();
        const result = await admin.from("absence_alerts").update({
          status,
          memo: blankToNull(data.memo),
          checked_at: status === "checked" ? now : undefined,
          checked_by: status === "checked" ? user.user_id : undefined,
          resolved_at: status === "resolved" ? now : undefined,
          resolved_by: status === "resolved" ? user.user_id : undefined,
        }).eq("alert_id", requiredString(data.alert_id, "alert_id")).select("*").single();
        return databaseResult(result.data, result.error);
      }
      case "getSettings": {
        requireAdmin(isAdmin);
        const result = await admin.from("settings").select("key,value");
        if (result.error) return databaseResult(null, result.error);
        return success(settingsObject(result.data ?? []));
      }
      case "updateSettings": {
        requireAdmin(isAdmin);
        const values = data as AppSettings;
        const rows = Object.entries(values).map(([key, value]) => ({ key, value: String(value), updated_by: user.user_id }));
        const result = await admin.from("settings").upsert(rows).select("key,value");
        if (result.error) return databaseResult(null, result.error);
        return success(settingsObject(result.data ?? []));
      }
      case "getBackupHistory":
        requireAdmin(isAdmin);
        return success({ items: [] });
      case "createBackup":
        requireAdmin(isAdmin);
        return failure("NOT_SUPPORTED", "Supabase Dashboard의 데이터베이스 백업 기능을 사용해주세요.", 400);
      default:
        return failure("NOT_FOUND", "지원하지 않는 action입니다.", 404);
    }
  } catch (error) {
    if (error instanceof ActionError) return failure(error.code, error.message, error.status);
    return failure("INTERNAL_ERROR", "처리 중 문제가 발생했습니다.", 500);
  }
}

async function getMembers(admin: any, cellIds: string[] | null, data: Record<string, unknown>) {
  let query = admin.from("members").select("*, cells:current_cell_id(cell_name)").order("display_name");
  if (cellIds) query = query.in("current_cell_id", cellIds);
  if (typeof data.cell_id === "string" && data.cell_id) {
    assertCellAccess(cellIds, data.cell_id);
    query = query.eq("current_cell_id", data.cell_id);
  }
  if (typeof data.status === "string" && data.status) query = query.eq("status", data.status);
  const { data: members, error } = await query;
  if (error) throw error;
  const ids = (members ?? []).map((item: { member_id: string }) => item.member_id);
  const [{ data: records }, { data: notes }] = ids.length ? await Promise.all([
    admin.from("weekly_member_records").select("member_id,report_date,attendance_status").in("member_id", ids).eq("attendance_status", "present").order("report_date", { ascending: false }),
    admin.from("member_notes").select("member_id").in("member_id", ids).eq("resolved", false),
  ]) : [{ data: [] }, { data: [] }];
  const keyword = typeof data.keyword === "string" ? data.keyword.trim().toLowerCase() : "";
  const items = (members ?? []).map((member: Record<string, any>) => ({
    ...member,
    current_cell_name: member.cells?.cell_name,
    cells: undefined,
    last_attendance_date: records?.find((record: any) => record.member_id === member.member_id)?.report_date,
    unresolved_note_count: notes?.filter((note: any) => note.member_id === member.member_id).length ?? 0,
  })).filter((member: Record<string, any>) => !keyword || [member.full_name, member.display_name, ...(member.name_aliases ?? [])].some((value) => String(value).toLowerCase().includes(keyword)));
  return success({ items });
}

async function getMemberDetail(admin: any, cellIds: string[] | null, memberId: string) {
  const { data: member, error } = await admin.from("members").select("*, cells:current_cell_id(cell_name)").eq("member_id", memberId).single();
  if (error) return databaseResult(null, error);
  assertCellAccess(cellIds, member.current_cell_id);
  const [{ data: records }, { data: notes }] = await Promise.all([
    admin.from("weekly_member_records").select("*").eq("member_id", memberId).order("week_start_date", { ascending: false }),
    admin.from("member_notes").select("*").eq("member_id", memberId).order("recorded_date", { ascending: false }),
  ]);
  return success({ member: { ...member, current_cell_name: member.cells?.cell_name, cells: undefined }, history: { records: records ?? [], notes: notes ?? [] } });
}

async function updateMember(admin: any, user: AppUser, cellIds: string[] | null, isAdmin: boolean, data: Record<string, unknown>) {
  const memberId = requiredString(data.member_id, "member_id");
  const { data: existing, error: existingError } = await admin.from("members").select("*").eq("member_id", memberId).single();
  if (existingError) throw existingError;
  assertCellAccess(cellIds, existing.current_cell_id);

  const fullName = requiredString(data.full_name, "full_name").trim();
  const displayName = requiredString(data.display_name, "display_name").trim();
  if (!fullName || !displayName) throw new ActionError("BAD_REQUEST", "이름과 표시 이름을 입력해주세요.", 400);

  const nextCellId = isAdmin
    ? requiredString(data.current_cell_id, "current_cell_id")
    : existing.current_cell_id;
  const nextStatus = isAdmin ? memberStatus(data.status) : existing.status;
  if (isAdmin) {
    const { data: cell, error: cellError } = await admin.from("cells").select("cell_id").eq("cell_id", nextCellId).eq("active", true).single();
    if (cellError || !cell) throw new ActionError("BAD_REQUEST", "활성 셀을 선택해주세요.", 400);
  } else if (
    (typeof data.current_cell_id === "string" && data.current_cell_id !== existing.current_cell_id)
    || (typeof data.status === "string" && data.status !== existing.status)
  ) {
    throw new ActionError("FORBIDDEN", "셀리더는 소속 셀과 성도 상태를 변경할 수 없습니다.", 403);
  }

  const payload = {
    full_name: fullName,
    display_name: displayName,
    name_aliases: stringArray(data.name_aliases),
    phone: blankToNull(data.phone),
    birth_date: dateOrNull(data.birth_date, "birth_date"),
    age: numberOrNull(data.age, "age", 0, 150),
    first_visit_date: dateOrNull(data.first_visit_date, "first_visit_date"),
    registration_date: dateOrNull(data.registration_date, "registration_date"),
    address: blankToNull(data.address),
    workplace: blankToNull(data.workplace),
    occupation: blankToNull(data.occupation),
    job_title: blankToNull(data.job_title),
    faith_start_year: numberOrNull(data.faith_start_year, "faith_start_year", 1000, 9999),
    bible_study_status: optionalEnum(data.bible_study_status, ["unknown", "not_started", "in_progress", "completed"], "bible_study_status"),
    baptism_status: optionalEnum(data.baptism_status, ["unknown", "not_baptized", "baptized", "infant_baptized", "confirmation"], "baptism_status"),
    family_info: blankToNull(data.family_info),
    memo: blankToNull(data.memo),
    current_cell_id: nextCellId,
    status: nextStatus,
    updated_by: user.user_id,
  };
  const { data: updated, error: updateError } = await admin.from("members").update(payload).eq("member_id", memberId).select("*, cells:current_cell_id(cell_name)").single();
  if (updateError) throw updateError;

  if (isAdmin && existing.current_cell_id !== nextCellId) {
    const today = new Date().toISOString().slice(0, 10);
    const { error: closeError } = await admin.from("cell_member_history").update({ end_date: today }).eq("member_id", memberId).is("end_date", null);
    if (closeError) throw closeError;
    const { error: historyError } = await admin.from("cell_member_history").insert({
      member_id: memberId,
      from_cell_id: existing.current_cell_id,
      to_cell_id: nextCellId,
      start_date: today,
      reason: "member profile update",
      changed_by: user.user_id,
    });
    if (historyError) throw historyError;
  }

  const changedFields = Object.keys(payload).filter((key) =>
    key !== "updated_by" && JSON.stringify(existing[key]) !== JSON.stringify(payload[key as keyof typeof payload]),
  );
  const { error: auditError } = await admin.from("audit_logs").insert({
    action: "update",
    target_type: "member",
    target_id: memberId,
    changed_by: user.user_id,
    before_value: { current_cell_id: existing.current_cell_id, status: existing.status },
    after_value: { current_cell_id: nextCellId, status: nextStatus, changed_fields: changedFields },
    memo: "member profile updated",
  });
  if (auditError) throw auditError;

  return success({ ...updated, current_cell_name: updated.cells?.cell_name, cells: undefined });
}

async function getReports(admin: any, cellIds: string[] | null, data: Record<string, unknown>) {
  let query = admin.from("weekly_cell_reports").select("*, cells(cell_name), users:leader_user_id(name)").order("week_start_date", { ascending: false });
  if (cellIds) query = query.in("cell_id", cellIds);
  if (typeof data.cell_id === "string" && data.cell_id) {
    assertCellAccess(cellIds, data.cell_id);
    query = query.eq("cell_id", data.cell_id);
  }
  const { data: reports, error } = await query;
  if (error) throw error;
  const ids = (reports ?? []).map((item: any) => item.report_id);
  const { data: records } = ids.length ? await admin.from("weekly_member_records").select("report_id").in("report_id", ids) : { data: [] };
  return success({ items: (reports ?? []).map((report: any) => ({
    ...report,
    cell_name: report.cells?.cell_name ?? "",
    leader_name: report.users?.name ?? "",
    record_count: records?.filter((record: any) => record.report_id === report.report_id).length ?? 0,
    cells: undefined,
    users: undefined,
  })) });
}

async function getReportDetail(admin: any, cellIds: string[] | null, reportId: string, isAdmin: boolean) {
  const list = await responseData(await getReports(admin, cellIds, {})) as { items: any[] };
  const report = list.items.find((item) => item.report_id === reportId);
  if (!report) throw new ActionError("NOT_FOUND", "리포트를 찾을 수 없습니다.", 404);
  const { data: records, error } = await admin.from("weekly_member_records").select("*, members:member_id(display_name,full_name)").eq("report_id", reportId).order("member_id");
  if (error) throw error;
  return success({
    report,
    records: (records ?? []).map((record: any) => ({
      ...record,
      member_display_name: record.members?.display_name ?? record.members?.full_name ?? "이름 미확인",
      members: undefined,
    })),
    can_edit: isAdmin || (!report.locked && report.status !== "locked" && dateInRange(report.week_start_date, report.week_end_date)),
  });
}

async function getWeeklyReportDraft(admin: any, user: AppUser, cellIds: string[] | null, data: Record<string, unknown>) {
  const cellId = requiredString(data.cell_id, "cell_id");
  assertCellAccess(cellIds, cellId);
  const weekStart = typeof data.week_start_date === "string" ? data.week_start_date : new Date().toISOString().slice(0, 10);
  const week = getWeekRange(weekStart);
  const [{ data: members }, { data: existing }] = await Promise.all([
    admin.from("members").select("*").eq("current_cell_id", cellId).eq("status", "active").order("display_name"),
    admin.from("weekly_cell_reports").select("*").eq("cell_id", cellId).eq("week_start_date", week.week_start_date).maybeSingle(),
  ]);
  const report = existing ?? {
    report_id: "", cell_id: cellId, leader_user_id: user.user_id, week_start_date: week.week_start_date,
    week_end_date: week.week_end_date, status: "draft", locked: false, overall_summary: "", created_at: "", updated_at: "",
  };
  const { data: records } = existing ? await admin.from("weekly_member_records").select("*").eq("report_id", existing.report_id) : { data: [] };
  return success({ is_existing: Boolean(existing), report, members: members ?? [], records: records ?? [], can_edit: user.roles.includes("admin") || dateInRange(week.week_start_date, week.week_end_date) });
}

async function saveWeeklyReport(admin: any, user: AppUser, cellIds: string[] | null, data: Record<string, unknown>) {
  const cellId = requiredString(data.cell_id, "cell_id");
  assertCellAccess(cellIds, cellId);
  const week = getWeekRange(requiredString(data.week_start_date, "week_start_date"));
  if (!user.roles.includes("admin") && !dateInRange(week.week_start_date, week.week_end_date)) {
    throw new ActionError("FORBIDDEN", "현재 주차의 담당 셀 리포트만 수정할 수 있습니다.", 403);
  }
  const reportId = typeof data.report_id === "string" && data.report_id || undefined;
  if (reportId) {
    const { data: existing, error } = await admin.from("weekly_cell_reports").select("cell_id,locked,status").eq("report_id", reportId).single();
    if (error) throw error;
    if (existing.cell_id !== cellId || (!user.roles.includes("admin") && (existing.locked || existing.status === "locked"))) {
      throw new ActionError("FORBIDDEN", "이 리포트를 수정할 수 없습니다.", 403);
    }
  }
  const payload = {
    cell_id: cellId, week_start_date: week.week_start_date, week_end_date: week.week_end_date,
    report_date: blankToNull(data.report_date), leader_user_id: user.user_id,
    overall_summary: blankToNull(data.overall_summary), status: data.status, submitted_at: data.status === "submitted" ? new Date().toISOString() : null,
  };
  const reportResult = reportId
    ? await admin.from("weekly_cell_reports").update(payload).eq("report_id", reportId).select("*").single()
    : await admin.from("weekly_cell_reports").upsert(payload, { onConflict: "cell_id,week_start_date" }).select("*").single();
  if (reportResult.error) throw reportResult.error;
  const records = Array.isArray(data.records) ? data.records as Record<string, unknown>[] : [];
  if (records.length) {
    const memberIds = [...new Set(records.map((record) => requiredString(record.member_id, "member_id")))];
    const { data: allowedMembers, error: memberError } = await admin.from("members").select("member_id").eq("current_cell_id", cellId).in("member_id", memberIds);
    if (memberError) throw memberError;
    if ((allowedMembers ?? []).length !== memberIds.length) {
      throw new ActionError("FORBIDDEN", "선택한 셀의 성도 기록만 저장할 수 있습니다.", 403);
    }
    const rows = records.map((record) => ({
      report_id: reportResult.data.report_id, member_id: record.member_id, cell_id: cellId,
      week_start_date: week.week_start_date, report_date: blankToNull(data.report_date),
      attendance_status: record.attendance_status ?? "unknown", absence_reason: blankToNull(record.absence_reason),
      sharing_summary: blankToNull(record.sharing_summary), prayer_request: blankToNull(record.prayer_request),
      support_suggestion: blankToNull(record.support_suggestion), prayer_source_text: blankToNull(record.prayer_source_text),
      prayer_parsed_by: record.prayer_parsed_by ?? null, prayer_parse_confidence: record.prayer_parse_confidence ?? null,
      created_by: user.user_id, updated_by: user.user_id,
    }));
    const { error } = await admin.from("weekly_member_records").upsert(rows, { onConflict: "report_id,member_id" });
    if (error) throw error;
  }
  return getReportDetail(admin, cellIds, reportResult.data.report_id, user.roles.includes("admin"));
}

async function convertNewcomer(admin: any, user: AppUser, data: Record<string, unknown>) {
  const newcomerId = requiredString(data.newcomer_id, "newcomer_id");
  const cellId = requiredString(data.cell_id, "cell_id");
  const { data: newcomer, error } = await admin.from("newcomers").select("*").eq("newcomer_id", newcomerId).single();
  if (error) throw error;
  if (newcomer.status === "converted") throw new ActionError("CONFLICT", "이미 성도로 전환되었습니다.", 409);
  const { data: member, error: memberError } = await admin.from("members").insert({
    full_name: newcomer.name, display_name: newcomer.name, phone: newcomer.phone, address: newcomer.address,
    current_cell_id: cellId, status: "active", first_visit_date: newcomer.submitted_at.slice(0, 10),
    created_by: user.user_id, updated_by: user.user_id,
  }).select("*").single();
  if (memberError) throw memberError;
  const { data: history, error: historyError } = await admin.from("cell_member_history").insert({
    member_id: member.member_id, to_cell_id: cellId, start_date: new Date().toISOString().slice(0, 10),
    reason: "newcomer conversion", changed_by: user.user_id,
  }).select("history_id").single();
  if (historyError) throw historyError;
  const { data: updated, error: updateError } = await admin.from("newcomers").update({
    status: "converted", converted_member_id: member.member_id, converted_at: new Date().toISOString(), converted_by: user.user_id,
  }).eq("newcomer_id", newcomerId).select("*").single();
  if (updateError) throw updateError;
  return success({ newcomer: updated, member, cell_member_history_id: history.history_id });
}

async function getUsers(admin: any) {
  const { data: users, error } = await admin.from("users").select("*").order("name");
  if (error) throw error;
  return success({ items: await Promise.all((users ?? []).map((user: any) => managedUser(admin, user))) });
}

async function managedUser(admin: any, user: any) {
  const { data: assignments } = await admin.from("user_cell_assignments").select("assignment_id,cell_id,assignment_role,cells(cell_name)").eq("user_id", user.user_id).eq("active", true);
  return { ...user, assigned_cells: (assignments ?? []).map((item: any) => ({ ...item, cell_name: item.cells?.cell_name ?? "", cells: undefined })) };
}

function settingsObject(rows: Array<{ key: string; value: string }>) {
  const raw = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...raw, long_absence_months: Number(raw.long_absence_months || 3) };
}

function assertCellAccess(cellIds: string[] | null, cellId: unknown) {
  if (typeof cellId !== "string" || (cellIds && !cellIds.includes(cellId))) throw new ActionError("FORBIDDEN", "담당 셀에만 접근할 수 있습니다.", 403);
}

function requireAdmin(isAdmin: boolean) {
  if (!isAdmin) throw new ActionError("FORBIDDEN", "관리자 권한이 필요합니다.", 403);
}

function requiredString(value: unknown, name: string) {
  if (typeof value !== "string" || !value) throw new ActionError("BAD_REQUEST", `${name}이 필요합니다.`, 400);
  return value;
}

function blankToNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
}

function dateOrNull(value: unknown, name: string) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ActionError("BAD_REQUEST", `${name} 형식을 확인해주세요.`, 400);
  return value;
}

function numberOrNull(value: unknown, name: string, min: number, max: number) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new ActionError("BAD_REQUEST", `${name} 값을 확인해주세요.`, 400);
  return number;
}

function optionalEnum(value: unknown, allowed: string[], name: string) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !allowed.includes(value)) throw new ActionError("BAD_REQUEST", `${name} 값을 확인해주세요.`, 400);
  return value;
}

function memberStatus(value: unknown) {
  return optionalEnum(value, ["active", "dormant", "left", "archived"], "status") ?? "active";
}

function dateInRange(start: string, end: string) {
  const today = new Date().toISOString().slice(0, 10);
  return today >= start && today <= end;
}

async function responseData(response: NextResponse) {
  const payload = await response.json() as { data: unknown };
  return payload.data;
}

function databaseResult(data: unknown, error: { code?: string; message?: string } | null) {
  if (!error) return success(data);
  const code = error.code === "23505" ? "CONFLICT" : "INTERNAL_ERROR";
  return failure(code, code === "CONFLICT" ? "중복된 데이터입니다." : "데이터베이스 처리 중 문제가 발생했습니다.", code === "CONFLICT" ? 409 : 500);
}

function success(data: unknown) {
  return NextResponse.json({ success: true, data, error: null });
}

function failure(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, data: null, error: { code, message } }, { status });
}

class ActionError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}
