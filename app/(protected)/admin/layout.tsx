import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccessAdminPages } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user.blcUser) redirect("/login");
  if (!canAccessAdminPages(session.user.blcUser)) redirect("/dashboard?error=forbidden");
  return children;
}
