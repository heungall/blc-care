import {
  matchMemberByName,
  normalizeName,
  parseMemberContentText,
  splitMemberContentLines,
} from "@/lib/member-content-parser";
import type { Member, PrayerParseResult } from "@/lib/types";

export { matchMemberByName, normalizeName };

export function splitPrayerLines(rawText: string) {
  return splitMemberContentLines(rawText);
}

export function parsePrayerText(rawText: string, members: Member[]): PrayerParseResult {
  const result = parseMemberContentText(rawText, members);

  return {
    items: result.items.map((item) => ({
      input_name: item.input_name,
      member_id: item.member_id,
      matched_name: item.matched_name,
      prayer_request: item.content,
      status: "matched",
      confidence: item.confidence,
    })),
    ambiguous: result.ambiguous.map((item) => ({
      input_name: item.input_name,
      prayer_request: item.content,
      status: "ambiguous",
      candidates: item.candidates,
    })),
    unmatched: result.unmatched.map((item) => ({
      input_name: item.input_name,
      prayer_request: item.content,
      status: "unmatched",
    })),
    invalid: result.invalid.map((item) => ({
      ...item,
      reason: item.reason === "내용이 비어 있습니다."
        ? "기도제목 내용이 비어 있습니다."
        : item.reason === "이름과 내용을 구분할 수 없습니다."
          ? "이름과 기도제목을 구분할 수 없습니다."
          : item.reason,
    })),
  };
}
