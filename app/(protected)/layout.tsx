import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentAppUser } from "@/lib/supabase/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
