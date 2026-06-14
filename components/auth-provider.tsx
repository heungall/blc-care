"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User;
  leaderMode: boolean;
  setLeaderMode: (leaderMode: boolean) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, user }: { children: ReactNode; user: User | null }) {
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
      logout: async () => {
        await fetch("/auth/signout", { method: "POST" });
        window.location.href = "/";
      },
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
