"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, LinkButton } from "@/components/ui";
import { hasRole } from "@/lib/permissions";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!hasRole(user, "admin")) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-xl font-bold">이 화면에 접근할 권한이 없습니다.</h1>
        <p className="mt-3 text-sm text-slate-500">새신자와 장기결석자 정보는 Admin 사용자만 조회할 수 있습니다.</p>
        <LinkButton href="/dashboard" className="mt-6">대시보드로 돌아가기</LinkButton>
      </Card>
    );
  }

  return children;
}
