import { z } from "zod";
import type { BaptismStatus, BibleStudyStatus, MemberStatus } from "@/lib/types";

export const MEMBER_CSV_MAX_ROWS = 500;
export const MEMBER_CSV_MAX_BYTES = 1024 * 1024;

export const memberCsvHeaders = [
  "full_name",
  "display_name",
  "name_aliases",
  "cell_name",
  "phone",
  "birth_date",
  "first_visit_date",
  "registration_date",
  "address",
  "workplace",
  "occupation",
  "job_title",
  "faith_start_year",
  "bible_study_status",
  "baptism_status",
  "family_info",
  "status",
  "memo",
] as const;

const optionalDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")]);
const optionalYear = z.union([z.literal(""), z.string().regex(/^\d{4}$/, "4자리 연도여야 합니다.")]);
const memberStatus = z.union([z.literal(""), z.enum(["active", "dormant", "left", "archived"])]);
const bibleStudyStatus = z.union([z.literal(""), z.enum(["unknown", "not_started", "in_progress", "completed"])]);
const baptismStatus = z.union([z.literal(""), z.enum(["unknown", "not_baptized", "baptized", "infant_baptized", "confirmation"])]);

const memberCsvRowSchema = z.object({
  full_name: z.string().trim().min(1, "full_name은 필수입니다.").max(100),
  display_name: z.string().trim().max(100),
  name_aliases: z.string().trim().max(500),
  cell_name: z.string().trim().max(100),
  phone: z.string().trim().max(100),
  birth_date: optionalDate,
  first_visit_date: optionalDate,
  registration_date: optionalDate,
  address: z.string().trim().max(500),
  workplace: z.string().trim().max(200),
  occupation: z.string().trim().max(200),
  job_title: z.string().trim().max(200),
  faith_start_year: optionalYear,
  bible_study_status: bibleStudyStatus,
  baptism_status: baptismStatus,
  family_info: z.string().trim().max(1000),
  status: memberStatus,
  memo: z.string().trim().max(2000),
});

export type MemberCsvImportRow = {
  full_name: string;
  display_name: string;
  name_aliases: string[];
  cell_name: string;
  phone: string;
  birth_date: string;
  first_visit_date: string;
  registration_date: string;
  address: string;
  workplace: string;
  occupation: string;
  job_title: string;
  faith_start_year: string;
  bible_study_status: BibleStudyStatus | "";
  baptism_status: BaptismStatus | "";
  family_info: string;
  status: MemberStatus;
  memo: string;
};

export type MemberCsvError = {
  row: number;
  message: string;
};

export type MemberCsvParseResult = {
  rows: MemberCsvImportRow[];
  errors: MemberCsvError[];
};

export function parseMemberCsv(csvText: string): MemberCsvParseResult {
  const parsed = parseCsv(csvText.replace(/^\uFEFF/, ""));
  if (parsed.length === 0) return { rows: [], errors: [{ row: 1, message: "CSV가 비어 있습니다." }] };

  const headers = parsed[0].map((header) => header.trim());
  const duplicateHeaders = headers.filter((header, index) => header && headers.indexOf(header) !== index);
  const unknownHeaders = headers.filter((header) => header && !memberCsvHeaders.includes(header as typeof memberCsvHeaders[number]));
  const errors: MemberCsvError[] = [];

  if (!headers.includes("full_name")) errors.push({ row: 1, message: "필수 헤더 full_name이 없습니다." });
  if (duplicateHeaders.length) errors.push({ row: 1, message: `중복 헤더가 있습니다: ${[...new Set(duplicateHeaders)].join(", ")}` });
  if (unknownHeaders.length) errors.push({ row: 1, message: `지원하지 않는 헤더가 있습니다: ${[...new Set(unknownHeaders)].join(", ")}` });
  if (errors.length) return { rows: [], errors };

  const dataRows = parsed.slice(1).filter((row) => row.some((value) => value.trim() !== ""));
  if (dataRows.length > MEMBER_CSV_MAX_ROWS) {
    return { rows: [], errors: [{ row: 1, message: `한 번에 최대 ${MEMBER_CSV_MAX_ROWS}명까지 등록할 수 있습니다.` }] };
  }

  const rows: MemberCsvImportRow[] = [];
  for (const [index, values] of dataRows.entries()) {
    if (values.length > headers.length && values.slice(headers.length).some((value) => value.trim() !== "")) {
      errors.push({ row: index + 2, message: "헤더보다 많은 열이 있습니다." });
      continue;
    }

    const raw = Object.fromEntries(memberCsvHeaders.map((header) => {
      const headerIndex = headers.indexOf(header);
      return [header, headerIndex >= 0 ? values[headerIndex]?.trim() ?? "" : ""];
    }));
    const result = memberCsvRowSchema.safeParse(raw);
    if (!result.success) {
      errors.push({
        row: index + 2,
        message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" / "),
      });
      continue;
    }

    rows.push({
      ...result.data,
      display_name: result.data.display_name || result.data.full_name,
      name_aliases: result.data.name_aliases.split("|").map((alias) => alias.trim()).filter(Boolean),
      status: (result.data.status || "active") as MemberStatus,
      bible_study_status: result.data.bible_study_status as BibleStudyStatus | "",
      baptism_status: result.data.baptism_status as BaptismStatus | "",
    });
  }

  if (!dataRows.length) errors.push({ row: 2, message: "등록할 성도 행이 없습니다." });
  return { rows, errors };
}

export function createMemberCsvTemplate() {
  return [
    memberCsvHeaders.join(","),
    [
      "홍길동",
      "홍길동",
      "길동|길동형제",
      "샘플 1셀",
      "010-0000-0000",
      "1990-01-01",
      "2026-01-04",
      "2026-01-11",
      "서울시 샘플구",
      "샘플 회사",
      "샘플 직업",
      "샘플 직책",
      "2020",
      "in_progress",
      "not_baptized",
      "샘플 가족 정보",
      "active",
      "샘플 메모",
    ].map(escapeCsvValue).join(","),
  ].join("\n");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value.replace(/\r$/, ""));
  if (row.some((item) => item !== "") || rows.length === 0) rows.push(row);
  return rows;
}

function escapeCsvValue(value: string) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
