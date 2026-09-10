"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  UserRoundPen,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, initials } from "@/lib/format";
import { useUserMutations, useUsers } from "@/modules/users/hooks/use-users";
import type { User, UserInput } from "@/modules/users/types/user";

const empty: UserInput & { password: string } = {
  email: "",
  phoneNumber: "",
  password: "",
  displayName: "",
  fullName: "",
  status: "ACTIVE",
};
export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(empty);
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);
  const users = useUsers({
    page,
    limit: 20,
    ...(query ? { search: query } : {}),
  });
  const mutations = useUserMutations();
  const showForm = (user?: User) => {
    setEditing(user ?? null);
    setForm(
      user
        ? {
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: "",
            displayName: user.displayName ?? "",
            fullName: user.fullName ?? "",
            status: user.status,
          }
        : empty,
    );
    setOpen(true);
  };
  const save = async () => {
    try {
      if (editing) {
        const { password, ...rest } = form;
        await mutations.update.mutateAsync({
          id: editing.id,
          input: { ...rest, ...(password ? { password } : {}) },
        });
      } else {
        await mutations.create.mutateAsync(form);
      }
      toast.success(editing ? "Đã cập nhật người dùng" : "Đã tạo người dùng");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu người dùng",
      );
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Xóa người dùng này? Hành động cần được xác nhận.")) return;
    try {
      await mutations.remove.mutateAsync(id);
      toast.success("Đã xóa người dùng");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa");
    }
  };
  return (
    <Page
      title="Quản lý người dùng"
      description="Quản lý tài khoản và quyền truy cập HVG."
      actions={
        <Button onClick={() => showForm()}>
          <Plus />
          Tạo người dùng
        </Button>
      }
    >
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo email hoặc tên hiển thị..."
          className="pl-10 h-10 rounded-xl bg-white shadow-2xs"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-2.5 rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {users.isLoading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
        </div>
      ) : users.isError ? (
        <div className="rounded-2xl border bg-danger-soft p-5 text-danger">
          Không thể tải người dùng.{" "}
          <button onClick={() => users.refetch()} className="underline">
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <DataTable
            rows={users.data?.data ?? []}
            rowKey={(row) => row.id}
            renderMobileCard={(row) => (
              <div className="rounded-2xl border bg-white p-4 shadow-xs transition active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-secondary font-bold text-primary text-sm">
                      {initials(row.displayName ?? row.email)}
                    </span>
                    <div>
                      <p className="font-bold text-base text-foreground leading-tight">
                        {row.displayName || row.fullName || "Chưa đặt tên"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{row.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={row.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-muted/40 p-2">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Số điện thoại
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {row.phoneNumber || "—"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Vai trò
                    </span>
                    <span className="font-semibold text-primary">{row.role}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                  <span className="text-[11px] text-muted-foreground">
                    Tạo: {formatDateTime(row.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showForm(row)}
                      className="h-8 gap-1.5 text-xs font-medium"
                    >
                      <UserRoundPen className="size-3.5" />
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(row.id)}
                      className="h-8 gap-1.5 text-xs font-medium text-danger hover:bg-danger-soft"
                    >
                      <Trash2 className="size-3.5" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            )}
            columns={[
              {
                key: "user",
                label: "Người dùng",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-secondary font-semibold text-primary">
                      {initials(row.displayName ?? row.email)}
                    </span>
                    <div>
                      <p className="font-medium">
                        {row.displayName || row.fullName || "Chưa đặt tên"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.email}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "phone",
                label: "Điện thoại",
                render: (row) => row.phoneNumber,
              },
              { key: "role", label: "Vai trò", render: (row) => row.role },
              {
                key: "status",
                label: "Trạng thái",
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: "date",
                label: "Ngày tạo",
                render: (row) => formatDateTime(row.createdAt),
              },
              {
                key: "actions",
                label: "",
                className: "text-right",
                render: (row) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => showForm(row)}
                      aria-label="Sửa"
                    >
                      <UserRoundPen />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(row.id)}
                      aria-label="Xóa"
                      className="text-danger"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          {/* Floating Action Button for Mobile */}
          <div className="fixed bottom-20 right-4 z-30 lg:hidden">
            <button
              onClick={() => showForm()}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xl transition active:scale-95"
            >
              <Plus className="size-5" />
              <span>Người dùng</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>{users.data?.meta.total ?? 0} người dùng</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="h-9 px-3 text-xs"
              >
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Trước</span>
              </Button>
              <span className="text-xs font-medium px-2">
                Trang {page} / {users.data?.meta.totalPages ?? 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (users.data?.meta.totalPages ?? 1)}
                onClick={() => setPage((value) => value + 1)}
                className="h-9 px-3 text-xs"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="text-xl font-bold">
                  {editing ? "Cập nhật người dùng" : "Tạo người dùng"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Các trường khớp trực tiếp với Users API.
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-2 hover:bg-muted">
                <X />
              </Dialog.Close>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["email", "Email", "email"],
                ["phoneNumber", "Số điện thoại", "tel"],
                ["displayName", "Tên hiển thị", "text"],
                ["fullName", "Họ và tên", "text"],
                [
                  "password",
                  editing ? "Mật khẩu mới (không bắt buộc)" : "Mật khẩu",
                  "password",
                ],
              ].map(([key, label, type]) => (
                <label
                  key={key}
                  className={key === "password" ? "sm:col-span-2" : ""}
                >
                  <span className="mb-1.5 block text-sm font-medium">
                    {label}
                  </span>
                  <Input
                    required={!editing || key !== "password"}
                    type={type}
                    value={String(form[key as keyof typeof form] ?? "")}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label>
                <span className="mb-1.5 block text-sm font-medium">
                  Trạng thái
                </span>
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as UserInput["status"],
                    })
                  }
                >
                  <option>ACTIVE</option>
                  <option>DISABLED</option>
                  <option>DELETED</option>
                </Select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Hủy</Button>
              </Dialog.Close>
              <Button
                onClick={save}
                disabled={
                  mutations.create.isPending || mutations.update.isPending
                }
              >
                {(mutations.create.isPending || mutations.update.isPending) && (
                  <LoaderCircle className="animate-spin" />
                )}
                Lưu
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Page>
  );
}
