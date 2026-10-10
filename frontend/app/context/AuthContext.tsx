"use client";

import { createContext, useContext } from "react";
import useAuth, { type UseAuth } from "../hooks/useAuth";
import { useHydrated } from "../hooks/useHydrated";

const AuthContext = createContext<UseAuth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  const hydrated = useHydrated();
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  // A streamed page may hydrate after the provider has read browser storage.
  // Keep each consumer's first snapshot identical to its server render.
  return hydrated ? ctx : { ...ctx, isLoggedIn: false, user: null, showLogin: false };
}
