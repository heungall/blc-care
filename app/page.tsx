import { Card, LinkButton } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl p-7 text-center sm:p-10">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">BLC</div>
        <h1 className="text-3xl font-bold tracking-tight">BLC Care</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
          공동체의 출결과 돌봄 기록을 차분하게 이어가는 관리 도구입니다.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <LinkButton href="/login">Google 로그인</LinkButton>
          <LinkButton href="/newcomer" variant="secondary">새신자 등록</LinkButton>
        </div>
        <p className="mt-6 text-xs text-slate-400">보호된 돌봄 정보는 허가된 Google 계정으로만 접근할 수 있습니다.</p>
      </Card>
    </main>
  );
}
