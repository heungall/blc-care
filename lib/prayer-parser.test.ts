import { describe, expect, it } from "vitest";
import { mockMembers } from "@/lib/mock-data";
import { normalizeName, parsePrayerText } from "@/lib/prayer-parser";

describe("prayer parser", () => {
  it("removes titles and matches aliases", () => {
    expect(normalizeName(" 하늘자매 ")).toBe("하늘");
    const result = parsePrayerText("푸름형제: 샘플 기도 내용", mockMembers.filter((m) => m.current_cell_id === "cell_a"));
    expect(result.items[0]?.matched_name).toBe("샘플푸름");
  });

  it("matches only within the selected cell", () => {
    const result = parsePrayerText("하늘: 샘플 기도 내용", mockMembers.filter((m) => m.current_cell_id === "cell_a"));
    expect(result.items).toHaveLength(1);
    expect(result.ambiguous).toHaveLength(0);
  });

  it("returns ambiguous when candidates share an alias", () => {
    const result = parsePrayerText("하늘: 샘플 기도 내용", mockMembers);
    expect(result.ambiguous[0]?.candidates).toHaveLength(2);
  });

  it("continues multiline prayers and merges duplicates", () => {
    const result = parsePrayerText(
      "푸름: 샘플 기도 내용 A\n이어지는 샘플 내용\n푸름: 샘플 기도 내용 B",
      mockMembers.filter((m) => m.current_cell_id === "cell_a"),
    );
    expect(result.items[0]?.prayer_request).toContain("이어지는 샘플 내용");
    expect(result.items[0]?.prayer_request).toContain("샘플 기도 내용 B");
  });

  it.each([":", "：", "-", ")", "/"])("supports the %s delimiter", (delimiter) => {
    const result = parsePrayerText(
      `푸름${delimiter} 샘플 기도 내용`,
      mockMembers.filter((member) => member.current_cell_id === "cell_a"),
    );
    expect(result.items[0]?.matched_name).toBe("샘플푸름");
  });

  it("returns unmatched and prayer-specific invalid reasons", () => {
    const members = mockMembers.filter((member) => member.current_cell_id === "cell_a");
    expect(parsePrayerText("없는이름: 샘플 기도 내용", members).unmatched).toHaveLength(1);
    expect(parsePrayerText("푸름:", members).invalid[0]?.reason).toBe("기도제목 내용이 비어 있습니다.");
    expect(parsePrayerText("구분자 없는 첫 줄", members).invalid[0]?.reason).toBe("이름과 기도제목을 구분할 수 없습니다.");
  });

  it("normalizes spaces, special characters, and English case", () => {
    expect(normalizeName("[ 샘 플 푸 름 ]형제")).toBe("샘플푸름");
    const englishMember = { ...mockMembers[0], member_id: "member_english", full_name: "Sample Zia", display_name: "Sample Zia", name_aliases: ["Zia"] };
    expect(parsePrayerText("zia: 샘플 기도 내용", [englishMember]).items[0]?.member_id).toBe("member_english");
  });
});
