import { describe, expect, it } from "vitest";
import { mockMembers } from "@/lib/mock-data";
import { parseMemberContentText } from "@/lib/member-content-parser";

describe("member content parser", () => {
  it("separates sharing summaries by member", () => {
    const members = mockMembers.filter((member) => member.current_cell_id === "cell_a");
    const result = parseMemberContentText(
      "하늘자매: 샘플 나눔 내용 A\n푸름/ 샘플 나눔 내용 B",
      members,
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.content).toBe("샘플 나눔 내용 A");
  });
});
