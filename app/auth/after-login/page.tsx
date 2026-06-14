import { redirect } from "next/navigation";
import { getRoleHome } from "@/lib/auth";
import { getCurrentAppUser } from "@/lib/supabase/auth";

export default async function AfterLoginPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?error=unregistered");
  redirect(getRoleHome(user));
}
