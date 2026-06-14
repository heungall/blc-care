import { cache } from "react";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { VerifiedUser } from "@/lib/api";

export const getCurrentAppUser = cache(async (): Promise<VerifiedUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser?.email || !authUser.email_confirmed_at) return null;

  const admin = createSupabaseAdminClient();
  const { data: user, error } = await admin
    .from("users")
    .select("*")
    .ilike("email", authUser.email)
    .maybeSingle();
  if (error || !user?.active) return null;

  if (user.auth_user_id && user.auth_user_id !== authUser.id) return null;
  if (!user.auth_user_id) {
    const { error: linkError } = await admin
      .from("users")
      .update({ auth_user_id: authUser.id })
      .eq("user_id", user.user_id)
      .is("auth_user_id", null);
    if (linkError) return null;
  }

  const { data: assignments } = await admin
    .from("user_cell_assignments")
    .select("cell_id, assignment_role, cells!inner(cell_name, active)")
    .eq("user_id", user.user_id)
    .eq("active", true);

  const normalizedAssignments = (assignments ?? []) as unknown as Array<{
    cell_id: string;
    assignment_role: string;
    cells: { cell_name: string; active: boolean } | null;
  }>;

  return {
    ...user,
    assigned_cells: normalizedAssignments
      .filter((item) => item.cells?.active)
      .map((item) => ({
        cell_id: item.cell_id,
        cell_name: item.cells!.cell_name,
        assignment_role: item.assignment_role,
      })),
  } as VerifiedUser;
});
