import { describe, expect, it } from "vitest";
import { getScopedCellIds } from "@/lib/data-scope";

describe("getScopedCellIds", () => {
  const assigned_cells = [{ cell_id: "cell-a" }, { cell_id: "cell-b" }];

  it("keeps admin scope unrestricted by default", () => {
    expect(getScopedCellIds({ roles: ["admin"], assigned_cells })).toBeNull();
  });

  it("limits cell leaders to assigned cells", () => {
    expect(getScopedCellIds({ roles: ["cell_leader"], assigned_cells })).toEqual(["cell-a", "cell-b"]);
  });

  it("limits admin plus cell leader users only when leader scope is requested", () => {
    const user = { roles: ["admin", "cell_leader"] as const, assigned_cells };
    expect(getScopedCellIds(user, "admin")).toBeNull();
    expect(getScopedCellIds(user, "leader")).toEqual(["cell-a", "cell-b"]);
  });
});
