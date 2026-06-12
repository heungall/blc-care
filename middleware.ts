import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessAdminPages } from "@/lib/auth";

export default auth((request) => {
  const appUser = request.auth?.user.blcUser;
  if (!appUser) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !canAccessAdminPages(appUser)
  ) {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/members/:path*", "/reports/:path*", "/admin/:path*"],
};
