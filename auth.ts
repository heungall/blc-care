import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { GasServerError, verifyUserServer } from "@/lib/gas-server";
import type { VerifiedUser } from "@/lib/api";

function loginErrorUrl(error: unknown) {
  if (error instanceof GasServerError) {
    if (error.code === "UNAUTHORIZED") return "/login?error=unregistered";
    if (error.code === "FORBIDDEN") return "/login?error=inactive";
  }
  return "/login?error=server";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return "/login?error=unregistered";
      try {
        await verifyUserServer(user.email);
        return true;
      } catch (error) {
        return loginErrorUrl(error);
      }
    },
    async jwt({ token }) {
      if (!token.email) {
        token.blcUser = undefined;
        token.authError = "unregistered";
        return token;
      }
      try {
        token.blcUser = await verifyUserServer(token.email);
        token.authError = undefined;
      } catch (error) {
        token.blcUser = undefined;
        token.authError = loginErrorUrl(error).split("error=")[1] ?? "server";
      }
      return token;
    },
    session({ session, token }) {
      session.user.blcUser = token.blcUser as VerifiedUser | undefined;
      session.authError = token.authError as string | undefined;
      return session;
    },
  },
});
