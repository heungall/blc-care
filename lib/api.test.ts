import { describe, expect, it } from "vitest";
import { ApiError, getApiErrorMessage } from "@/lib/api";

describe("Supabase API client", () => {
  it("maps API errors to a friendly user message", () => {
    expect(getApiErrorMessage(new ApiError("FORBIDDEN", "raw message"))).toBe(
      "이 작업을 수행할 권한이 없습니다.",
    );
  });
});
