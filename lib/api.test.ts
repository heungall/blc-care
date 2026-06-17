import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

const user = {
  user_id: "user_sample",
  email: "leader@example.invalid",
  name: "샘플 리더",
  roles: ["cell_leader"],
  active: true,
  created_at: "",
  updated_at: "",
} satisfies User;

describe("Supabase API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps API errors to a friendly user message", () => {
    expect(getApiErrorMessage(new ApiError("FORBIDDEN", "raw message"))).toBe(
      "이 작업을 수행할 권한이 없습니다.",
    );
  });

  it("passes member list query options and returns pagination metadata", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        data: {
          items: [],
          pagination: { page: 2, page_size: 10, total: 0, total_pages: 1 },
        },
        error: null,
      })),
    );

    const result = await api.getMembersList(user, {
      scope: "leader",
      keyword: "가온",
      sort: "name_desc",
      page: 2,
      page_size: 10,
    });

    expect(result.pagination.page).toBe(2);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).toEqual({
      action: "getMembers",
      data: {
        scope: "leader",
        keyword: "가온",
        sort: "name_desc",
        page: 2,
        page_size: 10,
      },
    });
  });
});
