import type { DefaultSession } from "next-auth";
import type { VerifiedUser } from "@/lib/api";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      blcUser?: VerifiedUser;
    };
    authError?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    blcUser?: VerifiedUser;
    authError?: string;
  }
}
