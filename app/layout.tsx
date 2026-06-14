import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { getCurrentAppUser } from "@/lib/supabase/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLC Care",
  description: "교회 출결 및 돌봄 관리",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentAppUser();
  return (
    <html lang="ko">
      <body>
        <AuthProvider user={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
