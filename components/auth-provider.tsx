"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "next-auth";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User;
  leaderMode: boolean;
  setLeaderMode: (leaderMode: boolean) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, session }: { children: ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user.blcUser;
  const [leaderMode, setLeaderMode] = useState(false);

  useEffect(() => {
    if (user) {
      setLeaderMode(user.roles.includes("cell_leader") && !user.roles.includes("admin"));
    }
  }, [user]);

  const value = useMemo(
    () => user ? {
      user,
      leaderMode,
      setLeaderMode,
      logout: () => signOut({ redirectTo: "/" }),
    } : null,
    [user, leaderMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used on an authenticated page.");
  return context;
}
