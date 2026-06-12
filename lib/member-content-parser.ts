import type {
  InvalidPrayerItem,
  Member,
  MemberContentParseResult,
} from "@/lib/types";

const TITLES = [
  "전도사님",
  "선생님",
  "목사님",
  "리더님",
  "전도사",
  "자매",
  "형제",
  "집사",
  "목사",
  "리더",
  "님",
];
const DELIMITER_PATTERN = /[:：)\-/]/;

export function normalizeName(value: string): string {
  let normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\[\](){}<>*_.,"']/g, "");

  for (const title of TITLES) {
    if (normalized.endsWith(title)) {
      normalized = normalized.slice(0, -title.length);
      break;
    }
  }
  return normalized;
}

type ParsedLine = { inputName: string; content: string };
export type MemberNameMatch =
  | { status: "matched"; member: Member; confidence: number }
  | { status: "ambiguous"; candidates: Member[] }
  | { status: "unmatched" };

export function splitMemberContentLines(rawText: string): {
  parsed: ParsedLine[];
  invalid: InvalidPrayerItem[];
} {
  const parsed: ParsedLine[] = [];
  const invalid: InvalidPrayerItem[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const delimiterIndex = line.search(DELIMITER_PATTERN);
    if (delimiterIndex < 0) {
      const previous = parsed.at(-1);
      if (previous) {
        previous.content = `${previous.content}\n${line}`;
      } else {
        invalid.push({
          raw_line: line,
          reason: "이름과 내용을 구분할 수 없습니다.",
          status: "invalid",
        });
      }
      continue;
    }

    const inputName = line.slice(0, delimiterIndex).trim();
    const content = line.slice(delimiterIndex + 1).trim();
    if (!inputName || !content) {
      invalid.push({
        raw_line: line,
        reason: !inputName ? "이름을 찾을 수 없습니다." : "내용이 비어 있습니다.",
        status: "invalid",
      });
      continue;
    }
    parsed.push({ inputName, content });
  }

  return { parsed, invalid };
}

export function matchMemberByName(inputName: string, members: Member[]): MemberNameMatch {
  const input = normalizeName(inputName);
  if (!input) return { status: "unmatched" };
  const fullMatches = members.filter((member) => normalizeName(member.full_name) === input);
  if (fullMatches.length === 1) return { status: "matched" as const, member: fullMatches[0], confidence: 1 };
  if (fullMatches.length > 1) return { status: "ambiguous" as const, candidates: fullMatches };

  const aliasMatches = members.filter((member) =>
    member.name_aliases.some((alias) => normalizeName(alias) === input),
  );
  if (aliasMatches.length === 1) return { status: "matched" as const, member: aliasMatches[0], confidence: 1 };
  if (aliasMatches.length > 1) return { status: "ambiguous" as const, candidates: aliasMatches };

  const suffixMatches = members.filter((member) => normalizeName(member.full_name).endsWith(input));
  if (suffixMatches.length === 1) return { status: "matched" as const, member: suffixMatches[0], confidence: 0.9 };
  if (suffixMatches.length > 1) return { status: "ambiguous" as const, candidates: suffixMatches };
  return { status: "unmatched" as const };
}

export function parseMemberContentText(rawText: string, members: Member[]): MemberContentParseResult {
  const { parsed, invalid } = splitMemberContentLines(rawText);
  const result: MemberContentParseResult = { items: [], ambiguous: [], unmatched: [], invalid };

  for (const line of parsed) {
    const match = matchMemberByName(line.inputName, members);
    if (match.status === "matched") {
      const existing = result.items.find((item) => item.member_id === match.member.member_id);
      if (existing) {
        existing.content = `${existing.content}\n${line.content}`;
      } else {
        result.items.push({
          input_name: line.inputName,
          member_id: match.member.member_id,
          matched_name: match.member.display_name,
          content: line.content,
          status: "matched",
          confidence: match.confidence,
        });
      }
    } else if (match.status === "ambiguous") {
      result.ambiguous.push({
        input_name: line.inputName,
        content: line.content,
        status: "ambiguous",
        candidates: match.candidates.map(({ member_id, display_name, full_name }) => ({
          member_id,
          display_name,
          full_name,
        })),
      });
    } else {
      result.unmatched.push({
        input_name: line.inputName,
        content: line.content,
        status: "unmatched",
      });
    }
  }

  return result;
}
