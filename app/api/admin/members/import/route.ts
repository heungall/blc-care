import { NextResponse } from "next/server";
import { canAccessAdminPages } from "@/lib/auth";
import {
  MEMBER_CSV_MAX_BYTES,
  parseMemberCsv,
  type MemberCsvError,
} from "@/lib/member-csv";
import { callSupabaseRpc, SupabaseServerError } from "@/lib/supabase-server";
import { getCurrentAppUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type ImportResponse = {
  imported_count: number;
  member_ids: string[];
};

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  if (!canAccessAdminPages(user)) return errorResponse("FORBIDDEN", "관리자 권한이 필요합니다.", 403);

  try {
    const requestText = await request.text();
    if (new TextEncoder().encode(requestText).byteLength > MEMBER_CSV_MAX_BYTES * 2 + 10_000) {
      return errorResponse("BAD_REQUEST", "CSV 파일이 너무 큽니다.", 413);
    }

    const body = JSON.parse(requestText) as { csv_text?: unknown };
    if (typeof body.csv_text !== "string") return errorResponse("BAD_REQUEST", "CSV 내용이 필요합니다.", 400);
    if (new TextEncoder().encode(body.csv_text).byteLength > MEMBER_CSV_MAX_BYTES) {
      return errorResponse("BAD_REQUEST", "CSV 파일은 최대 1MB까지 등록할 수 있습니다.", 413);
    }

    const parsed = parseMemberCsv(body.csv_text);
    if (parsed.errors.length) {
      return NextResponse.json(
        { success: false, data: null, error: { code: "VALIDATION_ERROR", message: "CSV 검증에 실패했습니다.", details: parsed.errors } },
        { status: 400 },
      );
    }

    const result = await callSupabaseRpc<ImportResponse>("import_members_csv", {
      p_rows: parsed.rows,
      p_actor_email: user.email,
    });
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("BAD_REQUEST", "요청 형식이 올바르지 않습니다.", 400);
    if (error instanceof SupabaseServerError) {
      const row = getSafeDatabaseErrorRow(error.message);
      const details = row ? [{ row: row + 1, message: "활성 셀 이름과 일치하지 않습니다." }] : [];
      return errorResponse("IMPORT_FAILED", "DB 등록에 실패했습니다. 셀 이름과 입력값을 확인해주세요.", 400, details);
    }
    return errorResponse("INTERNAL_ERROR", "성도 일괄 등록 중 오류가 발생했습니다.", 500);
  }
}

function getSafeDatabaseErrorRow(message: string) {
  const match = /^Unknown or inactive cell at row (\d+)$/.exec(message);
  return match ? Number(match[1]) : null;
}

function errorResponse(code: string, message: string, status: number, details: MemberCsvError[] = []) {
  return NextResponse.json(
    { success: false, data: null, error: { code, message, details } },
    { status },
  );
}
