"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button } from "@/components/ui";
import { hasRole } from "@/lib/permissions";

const baseItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/members", label: "성도 목록" },
  { href: "/reports", label: "리포트" },
];

const adminItems = [
  { href: "/admin/dashboard", label: "Admin 현황" },
  { href: "/admin/newcomers", label: "새신자 관리" },
  { href: "/admin/absence", label: "장기결석자" },
  { href: "/admin/cells", label: "셀 관리" },
  { href: "/admin/members/import", label: "성도 CSV 등록" },
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/settings", label: "설정" },
  { href: "/admin/backup", label: "백업" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, leaderMode, setLeaderMode, logout } = useAuth();
  const showMode = hasRole(user, "admin") && hasRole(user, "cell_leader");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Link href="/" className="text-xl font-bold text-blue-700">BLC Care</Link>
        <p className="mt-1 text-xs text-slate-500">차분한 돌봄 기록</p>
        <nav className="mt-8 space-y-1">
          {baseItems.map((item) => <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />)}
          {hasRole(user, "admin") && (
            <>
              <p className="px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Admin</p>
              {adminItems.map((item) => <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />)}
            </>
          )}
        </nav>
        <div className="mt-auto space-y-3 border-t border-slate-200 pt-5">
          <UserControls />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <Link href="/dashboard" className="font-bold text-blue-700 lg:hidden">BLC Care</Link>
          <div className="hidden text-sm text-slate-500 lg:block">
            {user.name} <Badge tone={leaderMode ? "primary" : "neutral"}>{leaderMode ? "셀리더 모드" : "Admin 모드"}</Badge>
            <span className="ml-2"><Badge tone="success">Google 로그인</Badge></span>
          </div>
          {showMode && (
            <Button variant="secondary" onClick={() => setLeaderMode(!leaderMode)}>
              {leaderMode ? "Admin 모드로" : "셀리더 모드로"}
            </Button>
          )}
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav className={`fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white px-2 py-2 lg:hidden ${hasRole(user, "admin") ? "grid-cols-4" : "grid-cols-3"}`}>
        {[...baseItems, ...(hasRole(user, "admin") ? [adminItems[0]] : [])].map((item) => (
          <Link key={item.href} href={item.href} className={`focus-ring rounded-xl px-2 py-3 text-center text-xs font-semibold ${pathname.startsWith(item.href) ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );

  function UserControls() {
    return (
      <>
        <p className="text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>로그아웃</Button>
      </>
    );
  }
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return <Link href={href} className={`focus-ring block rounded-xl px-3 py-3 text-sm font-semibold ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>{label}</Link>;
}
