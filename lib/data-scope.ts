import type { Role } from "@/lib/types";

export type DataScope = "admin" | "leader";

export type ScopedUser = {
  roles: readonly Role[];
  assigned_cells: ReadonlyArray<{ cell_id: string }>;
};

export function getScopedCellIds(user: ScopedUser, scope?: unknown) {
  if (!hasAdminScope(user, scope)) {
    return user.assigned_cells.map((item) => item.cell_id);
  }
  return null;
}

export function isLeaderScope(user: ScopedUser, scope?: unknown) {
  return scope === "leader" && user.roles.includes("cell_leader");
}

export function hasAdminScope(user: ScopedUser, scope?: unknown) {
  return user.roles.includes("admin") && !isLeaderScope(user, scope);
}
