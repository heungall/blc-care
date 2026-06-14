import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { canAccessAdminPages } from "@/lib/auth";
import { getCurrentAppUser } from "@/lib/supabase/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  if (!canAccessAdminPages(user)) redirect("/dashboard?error=forbidden");
  return children;
}
