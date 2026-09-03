import { AuthGuard } from "@/modules/auth/components/auth-guard";
import { AdminShell } from "@/layouts/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) { return <AuthGuard roles={["ADMIN"]}><AdminShell>{children}</AdminShell></AuthGuard>; }
