import { describe, expect, it } from "vitest";
import { ApiError, api, getApiErrorMessage, isGasApiConfigured } from "@/lib/api";
import { mockUsers } from "@/lib/mock-data";

describe("Phase 4 API client", () => {
  it("uses the development fallback when the GAS URL is not configured", async () => {
    expect(isGasApiConfigured).toBe(false);
    const user = await api.verifyUser(mockUsers[0].email);
    expect(user.user_id).toBe(mockUsers[0].user_id);
  });

  it("maps API errors to a friendly user message", () => {
    expect(getApiErrorMessage(new ApiError("FORBIDDEN", "raw message"))).toBe(
      "이 작업을 수행할 권한이 없습니다.",
    );
  });
});
