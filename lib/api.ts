import {
  mockCells,
  mockAbsenceAlerts,
  mockAssignments,
  mockBackupHistory,
  mockMemberNotes,
  mockMembers,
  mockNewcomers,
  mockReports,
  mockSettings,
  mockUsers,
} from "@/lib/mock-data";
import { parsePrayerText } from "@/lib/prayer-parser";
import type {
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
  WeeklyReport,
  AbsenceAlertStatus,
  AppSettings,
  AssignmentRole,
  Role,
} from "@/lib/types";

type GasError = {
  code: string;
  message: string;
};

type GasResponse<T> = {
  success: boolean;
  data: T | null;
  error: GasError | null;
};

export type VerifiedUser = User & {
  assigned_cells: Array<{
    cell_id: string;
    cell_name: string;
    assignment_role: string;
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

export type ReportDetail = {
  report: ReportListItem;
  records: WeeklyMemberRecord[];
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

export const isGasApiConfigured = Boolean(process.env.NEXT_PUBLIC_GAS_API_URL);

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

async function gasRequest<T>(
  action: string,
  email = "",
  data: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch("/api/gas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      requestUser: { email },
      data,
    }),
    cache: "no-store",
  });

  let payload: GasResponse<T>;
  try {
    payload = (await response.json()) as GasResponse<T>;
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

function mockVerifiedUser(email: string): VerifiedUser {
  const user = mockUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new ApiError("UNAUTHORIZED", friendlyMessages.UNAUTHORIZED);
  return { ...user, assigned_cells: [] };
}

function mockMemberDetail(memberId: string): MemberDetail {
  const member = mockMembers.find((item) => item.member_id === memberId);
  if (!member) throw new ApiError("NOT_FOUND", friendlyMessages.NOT_FOUND);
  return {
    member: {
      ...member,
      current_cell_name: mockCells.find((cell) => cell.cell_id === member.current_cell_id)?.cell_name,
    },
    history: {
      records: mockReports.flatMap((report) => report.records).filter((record) => record.member_id === memberId),
      notes: mockMemberNotes.filter((note) => note.member_id === memberId),
    },
  };
}

function mockReportList(): ReportListItem[] {
  return mockReports.map((report) => ({
    ...report,
    cell_name: mockCells.find((cell) => cell.cell_id === report.cell_id)?.cell_name ?? "미지정 셀",
    leader_name: mockUsers.find((user) => user.user_id === report.leader_user_id)?.name ?? "작성자 미지정",
    record_count: report.records.length,
  }));
}

async function withFallback<T>(realCall: () => Promise<T>, mockCall: () => T | Promise<T>) {
  return isGasApiConfigured ? realCall() : mockCall();
}

export const api = {
  verifyUser: (email: string) =>
    withFallback(
      async () => {
        const user = await gasRequest<VerifiedUser>("verifyUser", email);
        return {
          ...user,
          created_at: user.created_at ?? "",
          updated_at: user.updated_at ?? "",
        };
      },
      () => mockVerifiedUser(email),
    ),
  getCells: (user: User) =>
    withFallback(
      async () => (await gasRequest<{ items: Cell[] }>("getCells", user.email)).items,
      () => mockCells,
    ),
  getMembers: (user: User, data: Record<string, unknown> = {}) =>
    withFallback(
      async () => (await gasRequest<{ items: MemberView[] }>("getMembers", user.email, data)).items,
      () => mockMembers,
    ),
  getMemberDetail: (user: User, memberId: string) =>
    withFallback(
      () => gasRequest<MemberDetail>("getMemberDetail", user.email, { member_id: memberId }),
      () => mockMemberDetail(memberId),
    ),
  getReports: (user: User, data: Record<string, unknown> = {}) =>
    withFallback(
      async () => (await gasRequest<{ items: ReportListItem[] }>("getReports", user.email, data)).items,
      () => mockReportList(),
    ),
  getReportDetail: (user: User, reportId: string) =>
    withFallback(
      () => gasRequest<ReportDetail>("getReportDetail", user.email, { report_id: reportId }),
      () => {
        const report = mockReportList().find((item) => item.report_id === reportId);
        const source = mockReports.find((item) => item.report_id === reportId);
        if (!report || !source) throw new ApiError("NOT_FOUND", friendlyMessages.NOT_FOUND);
        return { report, records: source.records, can_edit: true };
      },
    ),
  getWeeklyReportDraft: (user: User, cellId: string, weekStartDate?: string) =>
    withFallback(
      () => gasRequest<WeeklyReportDraft>("getWeeklyReportDraft", user.email, {
        cell_id: cellId,
        week_start_date: weekStartDate,
      }),
      () => {
        const members = mockMembers.filter((member) => member.current_cell_id === cellId);
        const report = mockReports.find((item) => item.cell_id === cellId);
        return {
          is_existing: Boolean(report),
          report: report ?? {
            report_id: "",
            week_start_date: weekStartDate ?? "2026-06-08",
            week_end_date: "2026-06-14",
            cell_id: cellId,
            leader_user_id: user.user_id,
            status: "draft",
            locked: false,
            created_at: "",
            updated_at: "",
          },
          members,
          records: report?.records ?? [],
          can_edit: true,
        };
      },
    ),
  saveWeeklyReport: (user: User, payload: SaveReportPayload) =>
    withFallback(
      () => gasRequest<ReportDetail>("saveWeeklyReport", user.email, payload as unknown as Record<string, unknown>),
      () => ({ report: mockReportList()[0], records: [], can_edit: true }),
    ),
  parsePrayerRequests: (user: User, cellId: string, rawText: string, members: Member[]) =>
    withFallback(
      () => gasRequest<PrayerParseResult>("parsePrayerRequests", user.email, { cell_id: cellId, raw_text: rawText }),
      () => parsePrayerText(rawText, members),
    ),
  submitNewcomer: (values: NewcomerFormValues) =>
    withFallback(
      () => gasRequest<{ newcomer_id: string; status: NewcomerStatus; submitted_at: string }>("createNewcomer", "", values),
      () => ({ newcomer_id: "newcomer_mock", status: "new" as const, submitted_at: "" }),
    ),
  getNewcomers: (user: User, data: Record<string, unknown> = {}) =>
    withFallback(
      async () => (await gasRequest<{ items: Newcomer[] }>("getNewcomers", user.email, data)).items,
      () => mockNewcomers,
    ),
  updateNewcomer: (user: User, newcomerId: string, status: NewcomerStatus, adminMemo: string) =>
    withFallback(
      () => gasRequest<Newcomer>("updateNewcomerStatus", user.email, {
        newcomer_id: newcomerId,
        status,
        admin_memo: adminMemo,
      }),
      () => {
        const item = mockNewcomers.find((newcomer) => newcomer.newcomer_id === newcomerId);
        if (!item) throw new ApiError("NOT_FOUND", friendlyMessages.NOT_FOUND);
        return { ...item, status, admin_memo: adminMemo };
      },
    ),
  convertNewcomer: (user: User, newcomerId: string, cellId: string) =>
    withFallback(
      () => gasRequest<{ newcomer: Newcomer; member: Member; cell_member_history_id: string }>(
        "convertNewcomerToMember",
        user.email,
        { newcomer_id: newcomerId, cell_id: cellId },
      ),
      () => {
        const item = mockNewcomers.find((newcomer) => newcomer.newcomer_id === newcomerId);
        if (!item) throw new ApiError("NOT_FOUND", friendlyMessages.NOT_FOUND);
        return {
          newcomer: { ...item, status: "converted" as const, converted_member_id: "member_mock_converted" },
          member: mockMembers[0],
          cell_member_history_id: "history_mock",
        };
      },
    ),
};

// Phase 4 keeps unsupported management screens on the existing development mock adapter.
export const mockApi = {
  getUsers: () => mockUsers,
  getAssignments: () => mockAssignments,
  getCells: (user?: User) => {
    void user;
    return mockCells;
  },
  getMembers: (user?: User) => {
    void user;
    return mockMembers;
  },
  getReports: (user?: User): WeeklyReport[] => {
    void user;
    return mockReports;
  },
  getNewcomers: () => mockNewcomers,
  getAbsenceAlerts: () => mockAbsenceAlerts,
  updateAbsenceAlert: (alertId: string, status: AbsenceAlertStatus, memo: string) => {
    void [alertId, status, memo];
    return { success: true, message: "장기결석 조치 상태를 mock으로 반영했습니다." };
  },
  saveCell: (cell: Cell) => {
    void cell;
    return { success: true, message: "셀 정보를 mock으로 반영했습니다." };
  },
  createCell: (cellName: string) => {
    void cellName;
    return { success: true, message: "새 셀을 mock으로 생성했습니다." };
  },
  saveUser: (userId: string, name: string, email: string, roles: Role[], active: boolean) => {
    void [userId, name, email, roles, active];
    return { success: true, message: "사용자 정보를 mock으로 반영했습니다." };
  },
  createUser: (name: string, email: string) => {
    void [name, email];
    return { success: true, message: "새 사용자를 mock으로 등록했습니다." };
  },
  assignUserToCell: (userId: string, cellId: string, assignmentRole: AssignmentRole) => {
    void [userId, cellId, assignmentRole];
    return { success: true, message: "담당 셀 배정을 mock으로 반영했습니다." };
  },
  removeUserCellAssignment: (assignmentId: string) => {
    void assignmentId;
    return { success: true, message: "담당 셀 배정을 mock으로 해제했습니다." };
  },
  getSettings: () => mockSettings,
  saveSettings: (settings: AppSettings) => {
    void settings;
    return { success: true, message: "설정을 mock으로 반영했습니다." };
  },
  getBackupHistory: () => mockBackupHistory,
  createBackup: (format: "CSV" | "XLSX") => {
    void format;
    return { success: true, message: "백업 생성을 mock으로 완료했습니다." };
  },
  getMemberNotes: (memberId: string) => mockMemberNotes.filter((note) => note.member_id === memberId),
  cellName: (cellId?: string) => mockCells.find((cell) => cell.cell_id === cellId)?.cell_name ?? "미지정 셀",
  userName: (userId: string) => mockUsers.find((user) => user.user_id === userId)?.name ?? "알 수 없음",
};
