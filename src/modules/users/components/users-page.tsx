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
  phoneNumber: "+84",
  password: "",
  displayName: "",
  fullName: "",
  role: "USER",
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
            role: user.role,
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
      description="Quản lý tài khoản và quyền truy cập Fish ERP."
      actions={
        <Button onClick={() => showForm()}>
          <Plus />
          Tạo người dùng
        </Button>
      }
    >
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo email hoặc tên hiển thị"
          className="pl-10"
        />
      </div>
      {users.isLoading ? (
        <div className="h-56 rounded-2xl skeleton" />
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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{users.data?.meta.total ?? 0} người dùng</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= (users.data?.meta.totalPages ?? 1)}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight />
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
                  Vai trò
                </span>
                <Select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as UserInput["role"],
                    })
                  }
                >
                  <option>USER</option>
                  <option>ADMIN</option>
                  <option>SUPER_ADMIN</option>
                </Select>
              </label>
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
