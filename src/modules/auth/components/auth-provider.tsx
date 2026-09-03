"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { authService } from "@/modules/auth/services/auth.service";
import type { AuthUser, LoginInput } from "@/modules/auth/types/auth";

type AuthContextValue = { user: AuthUser | null; loading: boolean; login: (input: LoginInput) => Promise<AuthUser>; logout: () => Promise<void>; refetch: () => Promise<unknown> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["auth", "me"], queryFn: authService.me, retry: false, staleTime: 60_000 });
  const login = async (input: LoginInput) => { const response = await authService.login(input); queryClient.setQueryData(["auth", "me"], response.user); return response.user; };
  const logout = async () => { await authService.logout(); queryClient.setQueryData(["auth", "me"], null); queryClient.removeQueries(); };
  return <AuthContext.Provider value={{ user: query.data ?? null, loading: query.isLoading, login, logout, refetch: query.refetch }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
