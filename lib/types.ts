export type DateString = string;
export type DateTimeString = string;
export type YearString = string;

export type Role = "admin" | "cell_leader";
export type AssignmentRole = "leader" | "assistant";
export type MemberStatus = "active" | "dormant" | "left" | "archived";
export type BibleStudyStatus = "unknown" | "not_started" | "in_progress" | "completed";
export type BaptismStatus = "unknown" | "not_baptized" | "baptized" | "infant_baptized" | "confirmation";
export type AttendanceStatus = "present" | "absent" | "excused" | "unknown";
export type ReportStatus = "draft" | "submitted" | "locked";
export type PrayerParsedBy = "manual" | "rule" | "ai";
export type NewcomerStatus = "new" | "contacted" | "converted" | "archived";
export type AbsenceAlertStatus = "open" | "checked" | "resolved";
export type AuditAction = "create" | "update" | "delete" | "convert" | "resolve" | "login";

export type User = {
  user_id: string;
  email: string;
  name: string;
  roles: Role[];
  active: boolean;
  created_at: DateTimeString;
  updated_at: DateTimeString;
};

export type UserCellAssignment = {
  assignment_id: string;
  user_id: string;
  cell_id: string;
  assignment_role: AssignmentRole;
  active: boolean;
  start_date?: DateString;
  end_date?: DateString;
  created_at: DateTimeString;
  updated_at: DateTimeString;
};

export type Cell = {
  cell_id: string;
  cell_name: string;
  active: boolean;
  sort_order?: number;
  created_at: DateTimeString;
  updated_at: DateTimeString;
};

export type Member = {
  member_id: string;
  full_name: string;
  display_name: string;
  name_aliases: string[];
  photo_file_id?: string;
  photo_url?: string;
  phone?: string;
  birth_date?: DateString;
  age?: number;
  first_visit_date?: DateString;
  registration_date?: DateString;
  address?: string;
  workplace?: string;
  occupation?: string;
  job_title?: string;
  faith_start_year?: YearString;
  bible_study_status?: BibleStudyStatus;
  baptism_status?: BaptismStatus;
  family_info?: string;
  current_cell_id?: string;
  status: MemberStatus;
  memo?: string;
  created_at: DateTimeString;
  updated_at: DateTimeString;
  created_by?: string;
  updated_by?: string;
};

export type MemberView = Member & {
  current_cell_name?: string;
  last_attendance_date?: DateString;
  unresolved_note_count: number;
};

export type CellMemberHistory = {
  history_id: string;
  member_id: string;
  from_cell_id?: string;
  to_cell_id: string;
  start_date: DateString;
  end_date?: DateString;
  reason?: string;
  changed_by?: string;
  created_at: DateTimeString;
};

export type WeeklyCellReport = {
  report_id: string;
  week_start_date: DateString;
  week_end_date: DateString;
  report_date?: DateString;
  cell_id: string;
  leader_user_id: string;
  overall_summary?: string;
  status: ReportStatus;
  locked: boolean;
  created_at: DateTimeString;
  updated_at: DateTimeString;
  submitted_at?: DateTimeString;
};

export type WeeklyMemberRecord = {
  record_id: string;
  report_id: string;
  member_id: string;
  cell_id: string;
  week_start_date: DateString;
  report_date?: DateString;
  attendance_status: AttendanceStatus;
  absence_reason?: string;
  sharing_summary?: string;
  prayer_request?: string;
  support_suggestion?: string;
  prayer_source_text?: string;
  prayer_parsed_by?: PrayerParsedBy;
  prayer_parse_confidence?: number;
  created_at: DateTimeString;
  updated_at: DateTimeString;
  created_by?: string;
  updated_by?: string;
};

export type WeeklyReportView = WeeklyCellReport & {
  records: WeeklyMemberRecord[];
};

// Compatibility alias for the Phase 1 UI.
export type WeeklyReport = WeeklyReportView;

export type MemberNote = {
  note_id: string;
  member_id: string;
  note: string;
  recorded_date: DateString;
  recorded_by: string;
  resolved: boolean;
  resolved_date?: DateString;
  resolved_by?: string;
  created_at: DateTimeString;
  updated_at: DateTimeString;
};

export type Newcomer = {
  newcomer_id: string;
  name: string;
  phone: string;
  address?: string;
  visit_motivation?: string;
  visit_channel?: string;
  faith_experience?: string;
  after_service_plan?: string;
  privacy_agreed: boolean;
  status: NewcomerStatus;
  admin_memo?: string;
  converted_member_id?: string;
  submitted_at: DateTimeString;
  updated_at: DateTimeString;
  converted_at?: DateTimeString;
  converted_by?: string;
};

export type NewcomerFormValues = {
  name: string;
  phone: string;
  address: string;
  visit_motivation: string;
  visit_channel: string;
  faith_experience: string;
  after_service_plan: string;
  privacy_agreed: boolean;
};

export type AbsenceAlert = {
  alert_id: string;
  member_id: string;
  cell_id?: string;
  last_attended_date?: DateString;
  absence_months?: number;
  status: AbsenceAlertStatus;
  memo?: string;
  created_at: DateTimeString;
  checked_at?: DateTimeString;
  checked_by?: string;
  resolved_at?: DateTimeString;
  resolved_by?: string;
};

export type LongAbsenceCandidate = {
  member: Member;
  last_attended_date?: DateString;
  baseline_date: DateString;
  absence_months: number;
};

export type SettingKey =
  | "church_name"
  | "app_name"
  | "long_absence_months"
  | "report_edit_deadline_day"
  | "timezone";

export type Setting = {
  key: SettingKey;
  value: string;
  description?: string;
  updated_at: DateTimeString;
  updated_by?: string;
};

export type AppSettings = {
  church_name: string;
  app_name: string;
  long_absence_months: number;
  report_edit_deadline_day: string;
  timezone: string;
};

export type AuditLog = {
  log_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  changed_by?: string;
  changed_at: DateTimeString;
  before_value?: string;
  after_value?: string;
  memo?: string;
};

export type BackupHistory = {
  backup_id: string;
  format: "CSV" | "XLSX";
  created_at: DateTimeString;
  created_by: string;
  status: "completed";
  file_url?: string;
};

export type PrayerCandidate = {
  member_id: string;
  display_name: string;
  full_name: string;
};

export type MatchedPrayerItem = {
  input_name: string;
  member_id: string;
  matched_name: string;
  prayer_request: string;
  status: "matched";
  confidence: number;
};

export type AmbiguousPrayerItem = {
  input_name: string;
  prayer_request: string;
  status: "ambiguous";
  candidates: PrayerCandidate[];
};

export type UnmatchedPrayerItem = {
  input_name: string;
  prayer_request: string;
  status: "unmatched";
};

export type InvalidPrayerItem = {
  raw_line: string;
  reason: string;
  status: "invalid";
};

export type PrayerParseResult = {
  items: MatchedPrayerItem[];
  ambiguous: AmbiguousPrayerItem[];
  unmatched: UnmatchedPrayerItem[];
  invalid: InvalidPrayerItem[];
};

export type MatchedMemberContentItem = {
  input_name: string;
  member_id: string;
  matched_name: string;
  content: string;
  status: "matched";
  confidence: number;
};

export type AmbiguousMemberContentItem = {
  input_name: string;
  content: string;
  status: "ambiguous";
  candidates: PrayerCandidate[];
};

export type UnmatchedMemberContentItem = {
  input_name: string;
  content: string;
  status: "unmatched";
};

export type MemberContentParseResult = {
  items: MatchedMemberContentItem[];
  ambiguous: AmbiguousMemberContentItem[];
  unmatched: UnmatchedMemberContentItem[];
  invalid: InvalidPrayerItem[];
};

export function parseRoles(value: string): Role[] {
  return [...new Set(
    value
      .split(",")
      .map((role) => role.trim())
      .filter((role): role is Role => role === "admin" || role === "cell_leader"),
  )];
}

export function serializeRoles(roles: Role[]): string {
  return [...new Set(roles)].join(",");
}

export function parseAliases(value: string): string[] {
  return [...new Set(value.split(",").map((alias) => alias.trim()).filter(Boolean))];
}

export function serializeAliases(aliases: string[]): string {
  return [...new Set(aliases.map((alias) => alias.trim()).filter(Boolean))].join(",");
}
