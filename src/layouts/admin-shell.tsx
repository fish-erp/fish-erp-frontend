"use client";

import { FileSpreadsheet, ContactRound, LogOut, Menu, Package, PackageMinus, PackagePlus, Users, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useState } from "react";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth/components/auth-provider";

const navigation = [
  { href: "/admin/customers", label: "Khách hàng & công nợ", icon: ContactRound },
  { href: "/admin/products", label: "Quản lý sản phẩm", icon: Package },
  { href: "/admin/imports", label: "Nhập kho", icon: PackagePlus },
  { href: "/admin/exports", label: "Xuất hàng", icon: PackageMinus },
  { href: "/admin/reports", label: "Báo cáo", icon: FileSpreadsheet },
  { href: "/admin/users", label: "Quản lý người dùng", icon: Users },
];

const mobilePrimaryTabs = [
  { href: "/admin/exports", label: "Xuất hàng", icon: PackageMinus },
  { href: "/admin/imports", label: "Nhập kho", icon: PackagePlus },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/customers", label: "Khách hàng", icon: ContactRound },
];

function AdminNavigation({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-3">
      {navigation.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={close}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-muted",
            pathname === href || pathname.startsWith(`${href}/`)
              ? "bg-secondary text-primary"
              : "text-muted-foreground",
          )}
        >
          <Icon className="size-5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  const getActiveTabTitle = () => {
    if (pathname.includes("/admin/exports")) return "Xuất hàng";
    if (pathname.includes("/admin/imports")) return "Nhập kho";
    if (pathname.includes("/admin/products")) return "Sản phẩm";
    if (pathname.includes("/admin/customers")) return "Khách hàng";
    if (pathname.includes("/admin/users")) return "Người dùng";
    if (pathname.includes("/admin/reports")) return "Báo cáo";
    return "HVG Portal";
  };

  return (
    <div className="admin-shell min-h-screen bg-background lg:pl-64">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-white lg:flex print:hidden">
        <Link
          href="/admin/products"
          className="flex h-20 items-center gap-3 px-6 text-xl font-bold text-primary"
        >
          <BrandLogo />
          <span>
            HVG
            <br />
            <small className="text-xs font-medium text-muted-foreground">
              Administration Portal
            </small>
          </span>
        </Link>

        <div className="flex-1 overflow-y-auto py-3">
          <AdminNavigation />
        </div>

        <div className="border-t p-4">
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="admin-mobile-header sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white/95 px-4 backdrop-blur shadow-xs lg:hidden print:hidden">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={28} />
          <div>
            <h1 className="text-base font-bold leading-none text-foreground tracking-tight">
              {getActiveTabTitle()}
            </h1>
            <span className="text-[10px] font-medium text-muted-foreground">Kho HVG</span>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground transition active:scale-95"
          aria-label="Mở menu mở rộng"
        >
          <Menu className="size-4 text-primary" />
          <span>Menu</span>
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs transition-opacity"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(84vw,320px)] flex-col bg-white py-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="mb-4 flex items-center justify-between border-b px-5 pb-4">
              <div className="flex items-center gap-2.5">
                <BrandLogo size={36} />
                <div>
                  <strong className="block text-base font-bold text-primary leading-tight">HVG Portal</strong>
                  <span className="text-xs text-muted-foreground">Hệ thống quản lý kho</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted active:scale-95"
                aria-label="Đóng menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <p className="px-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Danh mục chức năng
              </p>
              <AdminNavigation close={() => setOpen(false)} />
            </div>

            <div className="border-t bg-muted/30 p-4">
              <div className="mb-3 px-1">
                <p className="text-xs text-muted-foreground">Đang đăng nhập:</p>
                <p className="truncate text-sm font-semibold text-foreground">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger/10 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/15 active:scale-98"
              >
                <LogOut className="size-4" />
                Đăng xuất
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t bg-white/95 px-1 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden safe-bottom print:hidden"
      >
        {mobilePrimaryTabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-all",
                  isActive ? "bg-primary/10 text-primary scale-105" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium tracking-tight mt-0.5",
                  isActive ? "font-bold text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* Tab 5: Menu mở rộng */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors text-muted-foreground hover:text-foreground",
            pathname.includes("/admin/users") || pathname.includes("/admin/reports")
              ? "text-primary font-bold"
              : "",
          )}
        >
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-all",
              pathname.includes("/admin/users") || pathname.includes("/admin/reports")
                ? "bg-primary/10 text-primary scale-105"
                : "text-muted-foreground",
            )}
          >
            <Menu className="size-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-0.5">
            Thêm
          </span>
        </button>
      </nav>

      <main>{children}</main>
    </div>
  );
}
