import { isDateWithin } from "@/lib/date";
import type {
  Cell,
  DateString,
  Member,
  Role,
  User,
  UserCellAssignment,
  WeeklyCellReport,
} from "@/lib/types";

export function hasRole(user: User, role: Role): boolean {
  return user.active && user.roles.includes(role);
}

export function isAssignmentActive(
  assignment: UserCellAssignment,
  today: DateString,
): boolean {
  return assignment.active
    && (!assignment.start_date || assignment.start_date <= today)
    && (!assignment.end_date || assignment.end_date >= today);
}

export function getAssignedCellIds(
  user: User,
  assignments: UserCellAssignment[],
  today: DateString,
): string[] {
  if (!hasRole(user, "cell_leader")) return [];
  return [...new Set(
    assignments
      .filter((assignment) => assignment.user_id === user.user_id && isAssignmentActive(assignment, today))
      .map((assignment) => assignment.cell_id),
  )];
}

export function canAccessCell(
  user: User,
  cellId: string,
  assignments: UserCellAssignment[],
  today: DateString,
  leaderMode = false,
): boolean {
  if (hasRole(user, "admin") && !leaderMode) return true;
  return getAssignedCellIds(user, assignments, today).includes(cellId);
}

export function getAccessibleCells(
  user: User,
  cells: Cell[],
  assignments: UserCellAssignment[],
  today: DateString,
  leaderMode = false,
): Cell[] {
  return cells.filter((cell) => cell.active && canAccessCell(user, cell.cell_id, assignments, today, leaderMode));
}

export function canAccessMember(
  user: User,
  member: Member,
  assignments: UserCellAssignment[],
  today: DateString,
  leaderMode = false,
): boolean {
  return Boolean(member.current_cell_id)
    && canAccessCell(user, member.current_cell_id as string, assignments, today, leaderMode);
}

export function canAccessReport(
  user: User,
  report: WeeklyCellReport,
  assignments: UserCellAssignment[],
  today: DateString,
  leaderMode = false,
): boolean {
  return canAccessCell(user, report.cell_id, assignments, today, leaderMode);
}

export function canEditReport(
  user: User,
  report: WeeklyCellReport,
  assignments: UserCellAssignment[],
  today: DateString,
): boolean {
  if (!user.active) return false;
  if (hasRole(user, "admin")) return true;
  return hasRole(user, "cell_leader")
    && canAccessReport(user, report, assignments, today, true)
    && !report.locked
    && report.status !== "locked"
    && isDateWithin(today, report.week_start_date, report.week_end_date);
}
