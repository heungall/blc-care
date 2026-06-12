import { describe, expect, it } from "vitest";
import { canAccessAdminPages, getRoleHome } from "@/lib/auth";

describe("role based login routing", () => {
  it("routes admins and dual-role users to the admin dashboard", () => {
    expect(getRoleHome({ roles: ["admin"] })).toBe("/admin/dashboard");
    expect(getRoleHome({ roles: ["admin", "cell_leader"] })).toBe("/admin/dashboard");
  });

  it("routes cell leaders to the regular dashboard and blocks admin pages", () => {
    const user = { roles: ["cell_leader"] as ("admin" | "cell_leader")[] };
    expect(getRoleHome(user)).toBe("/dashboard");
    expect(canAccessAdminPages(user)).toBe(false);
  });
});
