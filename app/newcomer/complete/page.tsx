import { Card, LinkButton } from "@/components/ui";

export default function NewcomerCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">✓</div>
        <h1 className="mt-5 text-2xl font-bold">등록이 완료되었습니다</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          방문해주셔서 감사합니다. 등록 내용이 안전하게 접수되었습니다.
        </p>
        <LinkButton href="/" className="mt-7 w-full">처음으로</LinkButton>
      </Card>
    </main>
  );
}
