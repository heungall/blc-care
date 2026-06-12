import { NewcomerForm } from "@/components/newcomer-form";
import { Badge, LinkButton } from "@/components/ui";

export default function NewcomerPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <Badge tone="primary">새신자 등록</Badge>
          <LinkButton href="/" variant="secondary">처음으로</LinkButton>
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">방문해주셔서 감사합니다</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          안내와 공동체 돌봄에 필요한 정보만 작성해주세요. 민감한 내용은 필요한 범위에서만 입력해주세요.
        </p>
      </header>
      <NewcomerForm />
    </main>
  );
}
