import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRoleHome } from "@/lib/auth";

export default async function AfterLoginPage() {
  const session = await auth();
  if (!session?.user.blcUser) {
    redirect(`/login?error=${session?.authError ?? "server"}`);
  }
  redirect(getRoleHome(session.user.blcUser));
}
