import type { Role } from "@/lib/types";

export type DataScope = "admin" | "leader";

export type ScopedUser = {
  roles: readonly Role[];
  assigned_cells: ReadonlyArray<{ cell_id: string }>;
};

export function getScopedCellIds(user: ScopedUser, scope?: unknown) {
  const isAdmin = user.roles.includes("admin");
  const isCellLeader = user.roles.includes("cell_leader");
  if (!isAdmin || (scope === "leader" && isCellLeader)) {
    return user.assigned_cells.map((item) => item.cell_id);
  }
  return null;
}
