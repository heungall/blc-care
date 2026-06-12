import type { Metadata } from "next";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLC Care",
  description: "교회 출결 및 돌봄 관리",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  return (
    <html lang="ko">
      <body>
        <AuthProvider session={session}>{children}</AuthProvider>
      </body>
    </html>
  );
}
