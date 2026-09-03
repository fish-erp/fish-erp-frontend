"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/modules/auth/components/auth-provider";
import type { UserRole } from "@/modules/auth/types/auth";

export function AuthGuard({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && roles && !roles.includes(user.role)) router.replace("/login");
  }, [loading, roles, router, user]);
  if (loading || !user || (roles && !roles.includes(user.role))) return <div className="flex min-h-screen items-center justify-center"><LoaderCircle className="size-7 animate-spin text-primary" aria-label="Đang kiểm tra phiên đăng nhập" /></div>;
  return children;
}
