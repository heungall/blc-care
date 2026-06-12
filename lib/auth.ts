import type { Role, User } from "@/lib/types";

export function hasAuthRole(user: Pick<User, "roles">, role: Role) {
  return user.roles.includes(role);
}

export function getRoleHome(user: Pick<User, "roles">) {
  return hasAuthRole(user, "admin") ? "/admin/dashboard" : "/dashboard";
}

export function canAccessAdminPages(user: Pick<User, "roles">) {
  return hasAuthRole(user, "admin");
}
