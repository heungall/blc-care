import type {
  AbsenceAlert,
  AbsenceAlertStatus,
  AppSettings,
  AssignmentRole,
  BackupHistory,
  Cell,
  Member,
  MemberNote,
  MemberView,
  Newcomer,
  NewcomerFormValues,
  NewcomerStatus,
  PrayerParseResult,
  User,
  WeeklyCellReport,
  WeeklyMemberRecord,
  Role,
  MemberStatus,
} from "@/lib/types";
import type { DataScope } from "@/lib/data-scope";

type ScopeOptions = { scope?: DataScope };
export type Pagination = { page: number; page_size: number; total: number; total_pages: number };
export type MemberListQuery = ScopeOptions & {
  cell_id?: string;
  status?: MemberStatus;
  keyword?: string;
  sort?: "name_asc" | "name_desc";
  page?: number;
  page_size?: number;
};

type ApiResponseError = {
  code: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiResponseError | null;
};

export type VerifiedUser = User & {
  assigned_cells: Array<{
    cell_id: string;
    cell_name: string;
    assignment_role: string;
  }>;
};

export type ManagedUser = User & {
  assigned_cells: Array<{
    assignment_id: string;
    cell_id: string;
    cell_name: string;
    assignment_role: AssignmentRole;
  }>;
};

export type ReportListItem = WeeklyCellReport & {
  cell_name: string;
  leader_name: string;
  record_count: number;
};

export type MemberDetail = {
  member: Member & { current_cell_name?: string };
  history: {
    records: WeeklyMemberRecord[];
    notes: MemberNote[];
  };
};

export type MemberListResult = {
  items: MemberView[];
  pagination: Pagination;
};

export type UpdateMemberPayload = Pick<Member,
  | "member_id"
  | "full_name"
  | "display_name"
  | "name_aliases"
  | "phone"
  | "birth_date"
  | "age"
  | "first_visit_date"
  | "registration_date"
  | "address"
  | "workplace"
  | "occupation"
  | "job_title"
  | "faith_start_year"
  | "bible_study_status"
  | "baptism_status"
  | "family_info"
  | "memo"
> & {
  current_cell_id?: string;
  status?: Member["status"];
};

export type ReportDetail = {
  report: ReportListItem;
  records: Array<WeeklyMemberRecord & { member_display_name: string }>;
  can_edit: boolean;
};

export type WeeklyReportDraft = {
  is_existing: boolean;
  report: WeeklyCellReport;
  members: Member[];
  records: WeeklyMemberRecord[];
  can_edit: boolean;
};

export type SaveReportPayload = {
  report_id?: string;
  cell_id: string;
  week_start_date: string;
  report_date?: string;
  overall_summary?: string;
  status: "draft" | "submitted";
  records: Array<Partial<WeeklyMemberRecord> & { member_id: string; attendance_status: string }>;
};

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

const friendlyMessages: Record<string, string> = {
  BAD_REQUEST: "입력 내용을 다시 확인해주세요.",
  UNAUTHORIZED: "등록된 사용자를 확인할 수 없습니다.",
  FORBIDDEN: "이 작업을 수행할 권한이 없습니다.",
  NOT_FOUND: "요청한 정보를 찾을 수 없습니다.",
  CONFLICT: "이미 처리된 정보이거나 중복된 요청입니다.",
  CONFIG_ERROR: "서버 연결 설정을 확인해주세요.",
  SHEET_NOT_FOUND: "필요한 데이터 시트를 찾을 수 없습니다.",
  INVALID_SHEET: "데이터 시트 구성을 확인해주세요.",
  NETWORK_ERROR: "서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
  INTERNAL_ERROR: "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return friendlyMessages[error.code] ?? error.message;
  }
  return friendlyMessages.INTERNAL_ERROR;
}

async function supabaseRequest<T>(
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch("/api/supabase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      data,
    }),
    cache: "no-store",
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("NETWORK_ERROR", friendlyMessages.NETWORK_ERROR);
  }

  if (!response.ok || !payload.success || payload.data === null) {
    throw new ApiError(
      payload.error?.code ?? "INTERNAL_ERROR",
      payload.error?.message ?? friendlyMessages.INTERNAL_ERROR,
    );
  }
  return payload.data;
}

export const api = {
  verifyUser: async (email: string) => {
    void email;
    const user = await supabaseRequest<VerifiedUser>("verifyUser");
    return { ...user, created_at: user.created_at ?? "", updated_at: user.updated_at ?? "" };
  },
  getCells: async (user: User, data: ScopeOptions = {}) => {
    void user;
    return (await supabaseRequest<{ items: Cell[] }>("getCells", data)).items;
  },
  getMembers: async (user: User, data: Record<string, unknown> = {}) =>
    (await supabaseRequest<{ items: MemberView[] }>("getMembers", { page_size: 100, ...data })).items,
  getMembersList: (user: User, data: MemberListQuery = {}) => {
    void user;
    return supabaseRequest<MemberListResult>("getMembers", data as Record<string, unknown>);
  },
  getMemberDetail: (user: User, memberId: string, data: ScopeOptions = {}) =>
    supabaseRequest<MemberDetail>("getMemberDetail", { member_id: memberId, ...data }),
  updateMember: (user: User, payload: UpdateMemberPayload, data: ScopeOptions = {}) =>
    supabaseRequest<Member & { current_cell_name?: string }>("updateMember", { ...(payload as unknown as Record<string, unknown>), ...data }),
  getReports: async (user: User, data: Record<string, unknown> = {}) =>
    (await supabaseRequest<{ items: ReportListItem[] }>("getReports", data)).items,
  getReportDetail: (user: User, reportId: string, data: ScopeOptions = {}) =>
    supabaseRequest<ReportDetail>("getReportDetail", { report_id: reportId, ...data }),
  getWeeklyReportDraft: (user: User, cellId: string, weekStartDate?: string, data: ScopeOptions = {}) =>
    supabaseRequest<WeeklyReportDraft>("getWeeklyReportDraft", {
      cell_id: cellId,
      week_start_date: weekStartDate,
      ...data,
    }),
  saveWeeklyReport: (user: User, payload: SaveReportPayload, data: ScopeOptions = {}) =>
    supabaseRequest<ReportDetail>("saveWeeklyReport", { ...(payload as unknown as Record<string, unknown>), ...data }),
  parsePrayerRequests: (user: User, cellId: string, rawText: string) =>
    supabaseRequest<PrayerParseResult>("parsePrayerRequests", { cell_id: cellId, raw_text: rawText }),
  submitNewcomer: (values: NewcomerFormValues) =>
    supabaseRequest<{ newcomer_id: string; status: NewcomerStatus; submitted_at: string }>("createNewcomer", values),
  getNewcomers: async (user: User, data: Record<string, unknown> = {}) =>
    (await supabaseRequest<{ items: Newcomer[] }>("getNewcomers", data)).items,
  updateNewcomer: (user: User, newcomerId: string, status: NewcomerStatus, adminMemo: string) =>
    supabaseRequest<Newcomer>("updateNewcomerStatus", {
      newcomer_id: newcomerId,
      status,
      admin_memo: adminMemo,
    }),
  convertNewcomer: (user: User, newcomerId: string, cellId: string) =>
    supabaseRequest<{ newcomer: Newcomer; member: Member; cell_member_history_id: string }>(
      "convertNewcomerToMember",
      { newcomer_id: newcomerId, cell_id: cellId },
    ),
  getUsers: async (user: User) => {
    void user;
    return (await supabaseRequest<{ items: ManagedUser[] }>("getUsers")).items;
  },
  createUser: (user: User, data: { name: string; email: string; roles: Role[]; active?: boolean }) =>
    supabaseRequest<ManagedUser>("createUser", data),
  updateUser: (user: User, data: { user_id: string; name: string; email: string; roles: Role[]; active: boolean }) =>
    supabaseRequest<ManagedUser>("updateUser", data),
  assignUserToCell: (user: User, userId: string, cellId: string, assignmentRole: AssignmentRole) =>
    supabaseRequest("assignUserToCell", { user_id: userId, cell_id: cellId, assignment_role: assignmentRole }),
  unassignUserFromCell: (user: User, assignmentId: string) =>
    supabaseRequest("unassignUserFromCell", { assignment_id: assignmentId }),
  createCell: (user: User, cellName: string) =>
    supabaseRequest<Cell>("createCell", { cell_name: cellName }),
  updateCell: (user: User, cell: Cell) =>
    supabaseRequest<Cell>("updateCell", cell as unknown as Record<string, unknown>),
  getAbsenceAlerts: async (user: User) => {
    void user;
    return (await supabaseRequest<{ items: AbsenceAlert[] }>("getAbsenceAlerts")).items;
  },
  updateAbsenceAlert: (user: User, alertId: string, status: AbsenceAlertStatus, memo: string) =>
    supabaseRequest<AbsenceAlert>("updateAbsenceAlert", { alert_id: alertId, status, memo }),
  getSettings: (user: User) => {
    void user;
    return supabaseRequest<AppSettings>("getSettings");
  },
  updateSettings: (user: User, settings: AppSettings) =>
    supabaseRequest<AppSettings>("updateSettings", settings as unknown as Record<string, unknown>),
  getBackupHistory: async (user: User) => {
    void user;
    return (await supabaseRequest<{ items: BackupHistory[] }>("getBackupHistory")).items;
  },
  createBackup: (user: User, format: "CSV" | "XLSX") =>
    supabaseRequest<BackupHistory>("createBackup", { format }),
};
