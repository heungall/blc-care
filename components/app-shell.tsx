"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const showMode = hasRole(user, "admin") && hasRole(user, "cell_leader");
  const isAdmin = hasRole(user, "admin");

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
      if (event.key !== "Tab") return;

      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Link href="/" className="text-xl font-bold text-blue-700">BLC Care</Link>
        <p className="mt-1 text-xs text-slate-500">차분한 돌봄 기록</p>
        <nav className="mt-8 space-y-1">
          {baseItems.map((item) => <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />)}
          {isAdmin && (
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
          <div className="flex items-center gap-2">
            {showMode && (
              <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => setLeaderMode(!leaderMode)}>
                {leaderMode ? "Admin 모드로" : "셀리더 모드로"}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="inline-flex min-h-11 items-center gap-2 px-3 lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
              <span>전체 메뉴</span>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav aria-label="주요 메뉴" className={`fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white px-2 py-2 lg:hidden ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
        {[...baseItems, ...(isAdmin ? [adminItems[0]] : [])].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname.startsWith(item.href) ? "page" : undefined}
            className={`focus-ring rounded-xl border px-2 py-2 text-center text-xs font-semibold ${
              pathname.startsWith(item.href)
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-transparent text-slate-500"
            }`}
          >
            <span className="block">{item.label}</span>
            {pathname.startsWith(item.href) && <span className="mt-0.5 block text-[10px] font-bold">현재</span>}
          </Link>
        ))}
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            aria-label="전체 메뉴 닫기"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            ref={mobileMenuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="전체 메뉴"
            className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col overflow-y-auto bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="font-bold text-blue-700">BLC Care</p>
                <p className="mt-1 text-xs text-slate-500">전체 메뉴</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="focus-ring min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                aria-label="전체 메뉴 닫기"
                onClick={() => setMobileMenuOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="border-b border-slate-200 px-5 py-4">
              <UserSummary />
              {showMode && (
                <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => setLeaderMode(!leaderMode)}>
                  {leaderMode ? "Admin 모드로 전환" : "셀리더 모드로 전환"}
                </Button>
              )}
            </div>

            <nav aria-label="전체 메뉴" className="flex-1 space-y-1 px-4 py-4">
              {baseItems.map((item) => <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} onNavigate={() => setMobileMenuOpen(false)} />)}
              {isAdmin && (
                <>
                  <p className="px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Admin</p>
                  {adminItems.map((item) => <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} onNavigate={() => setMobileMenuOpen(false)} />)}
                </>
              )}
            </nav>

            <div className="border-t border-slate-200 p-5">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
              >
                로그아웃
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );

  function UserControls() {
    return (
      <>
        <UserSummary />
        <Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>로그아웃</Button>
      </>
    );
  }

  function UserSummary() {
    return (
      <>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{user.name}</p>
          <Badge tone={leaderMode ? "primary" : "neutral"}>{leaderMode ? "셀리더 모드" : "Admin 모드"}</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
      </>
    );
  }
}

function NavLink({ href, label, active, onNavigate }: { href: string; label: string; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`focus-ring flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-transparent text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
      {active && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">현재</span>}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
