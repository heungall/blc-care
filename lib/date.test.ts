import { describe, expect, it } from "vitest";
import {
  addMonths,
  completeMonthsBetween,
  getWeekRange,
  isDateWithin,
  parseDateString,
} from "@/lib/date";

describe("date helpers", () => {
  it("calculates a Monday to Sunday week", () => {
    expect(getWeekRange("2026-06-12")).toEqual({
      week_start_date: "2026-06-08",
      week_end_date: "2026-06-14",
    });
  });

  it("clamps month addition at the end of a month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("counts only complete months", () => {
    expect(completeMonthsBetween("2026-03-12", "2026-06-11")).toBe(2);
    expect(completeMonthsBetween("2026-03-12", "2026-06-12")).toBe(3);
  });

  it("checks inclusive date ranges and rejects invalid dates", () => {
    expect(isDateWithin("2026-06-08", "2026-06-08", "2026-06-14")).toBe(true);
    expect(() => parseDateString("2026-02-30")).toThrow();
  });
});
