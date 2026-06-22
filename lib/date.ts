import type { DateString } from "@/lib/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateString(value: DateString): Date {
  if (!DATE_PATTERN.test(value)) throw new Error(`Invalid date string: ${value}`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || formatDateString(date) !== value) {
    throw new Error(`Invalid date string: ${value}`);
  }
  return date;
}

export function formatDateString(date: Date): DateString {
  return date.toISOString().slice(0, 10);
}

export function getTodayInTimeZone(timeZone = "Asia/Seoul", now = new Date()): DateString {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(value: DateString, days: number): DateString {
  const date = parseDateString(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateString(date);
}

export function addMonths(value: DateString, months: number): DateString {
  const source = parseDateString(value);
  const day = source.getUTCDate();
  const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return formatDateString(target);
}

export function getWeekRange(value: DateString): { week_start_date: DateString; week_end_date: DateString } {
  const date = parseDateString(value);
  const daysFromSunday = date.getUTCDay();
  const week_start_date = addDays(value, -daysFromSunday);
  return { week_start_date, week_end_date: addDays(week_start_date, 6) };
}

export function isDateWithin(value: DateString, start: DateString, end: DateString): boolean {
  return value >= start && value <= end;
}

export function completeMonthsBetween(start: DateString, end: DateString): number {
  const startDate = parseDateString(start);
  const endDate = parseDateString(end);
  if (endDate < startDate) return 0;

  let months = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
    + endDate.getUTCMonth() - startDate.getUTCMonth();
  if (endDate.getUTCDate() < startDate.getUTCDate()) months -= 1;
  return Math.max(0, months);
}
