import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Badge, Button, Card, LinkButton } from "@/components/ui";
import { getRoleHome } from "@/lib/auth";

const errorMessages: Record<string, string> = {
  unregistered: "등록되지 않은 계정입니다. 관리자에게 문의해주세요.",
  inactive: "비활성화된 계정입니다. 관리자에게 문의해주세요.",
  forbidden: "이 화면에 접근할 권한이 없습니다.",
  server: "로그인 확인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  OAuthAccountNotLinked: "같은 이메일의 기존 로그인 방식과 연결할 수 없습니다.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user.blcUser) {
    redirect(getRoleHome(session.user.blcUser));
  }
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
      <Card className="w-full p-7 text-center sm:p-10">
        <Badge tone="primary">Google OAuth</Badge>
        <h1 className="mt-4 text-3xl font-bold">BLC Care 로그인</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          허가된 Google 계정으로 로그인하면 등록 상태와 역할을 확인합니다.
        </p>
        {error && (
          <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">
            {errorMessages[error] ?? errorMessages.server}
          </p>
        )}
        <form
          className="mt-7"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/auth/after-login" });
          }}
        >
          <Button type="submit" className="w-full">Google 계정으로 로그인</Button>
        </form>
        <p className="mt-4 text-xs text-slate-400">
          미등록 계정과 비활성 계정은 보호 페이지에 접근할 수 없습니다.
        </p>
        <LinkButton href="/" variant="secondary" className="mt-6">처음으로</LinkButton>
      </Card>
    </main>
  );
}
