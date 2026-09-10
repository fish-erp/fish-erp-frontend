"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProductMutations, useProducts } from "@/modules/products/hooks/use-products";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type {
  Product,
  ProductInput,
  ProductStatus,
  ProductType,
} from "@/modules/products/types/product";

const typeLabels: Record<ProductType, string> = {
  MEDICINE: "Thuốc",
  FEED: "Thức ăn",
  OTHER: "Khác",
  UNKNOWN: "Chưa xác định",
};

const statusLabels: Record<ProductStatus, string> = {
  SELLING: "Đang bán",
  PAUSED: "Tạm ngưng",
  DISCONTINUED: "Ngừng kinh doanh",
};

const statusOptions: ProductStatus[] = ["SELLING", "PAUSED", "DISCONTINUED"];
const typeOptions: ProductType[] = ["MEDICINE", "FEED", "OTHER", "UNKNOWN"];

const empty: ProductInput = {
  productCode: "",
  productName: "",
  productPrice: 0,
  productUnit: "",
  productNote: "",
  type: "UNKNOWN",
  status: "SELLING",
};

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductType | "">("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(empty);
  const [deleting, setDeleting] = useState<Product | null>(null);


  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const products = useProducts({
    page,
    limit: 20,
    ...(query ? { search: query } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const mutations = useProductMutations();

  const showForm = (product?: Product) => {
    setEditing(product ?? null);
    setForm(
      product
        ? {
            productCode: product.productCode,
            productName: product.productName,
            productPrice: product.productPrice,
            productUnit: product.productUnit,
            productNote: product.productNote ?? "",
            type: product.type,
            status: product.status,
          }
        : empty,
    );
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload: ProductInput = {
        ...form,
        productCode: form.productCode.trim(),
        productName: form.productName.trim(),
        productUnit: form.productUnit.trim(),
        productPrice: Number(form.productPrice) || 0,
        ...(form.productNote?.trim() ? { productNote: form.productNote.trim() } : {}),
      };
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, input: payload });
      } else {
        await mutations.create.mutateAsync(payload);
      }
      toast.success(editing ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu sản phẩm");
    }
  };

  // const remove = async (id: string) => {
  //   if (!confirm("Xóa sản phẩm này? Hành động cần được xác nhận.")) return;
  //   try {
  //     await mutations.remove.mutateAsync(id);
  //     toast.success("Đã xóa sản phẩm");
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Không thể xóa");
  //   }
  // };
  const remove = async () => {
  if (!deleting) return;
  try {
    await mutations.remove.mutateAsync(deleting.id);
    toast.success("Đã xóa sản phẩm");
    setDeleting(null);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Không thể xóa");
  }
};

  return (
    <Page
      title="Quản lý sản phẩm"
      description="Danh mục thuốc, thức ăn và vật tư cho cá."
      actions={
        <Button onClick={() => showForm()}>
          <Plus />
          Tạo sản phẩm
        </Button>
      }
    >
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã hoặc tên sản phẩm..."
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

        {/* Desktop Filter Dropdowns */}
        <div className="hidden sm:flex sm:items-center gap-3">
          <Select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as ProductType | "");
              setPage(1);
            }}
            className="sm:w-48"
          >
            <option value="">Tất cả loại</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as ProductStatus | "");
              setPage(1);
            }}
            className="sm:w-48"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </Select>
        </div>

        {/* Mobile Horizontal Filter Chips */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 font-medium transition active:scale-95",
                statusFilter === ""
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-muted-foreground border hover:bg-muted",
              )}
            >
              Tất cả trạng thái
            </button>
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 font-medium transition active:scale-95",
                  statusFilter === status
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white text-muted-foreground border hover:bg-muted",
                )}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => {
                setTypeFilter("");
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition active:scale-95",
                typeFilter === ""
                  ? "bg-foreground/10 text-foreground font-semibold"
                  : "bg-white/80 text-muted-foreground border hover:bg-muted",
              )}
            >
              Tất cả loại
            </button>
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setTypeFilter(type);
                  setPage(1);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition active:scale-95",
                  typeFilter === type
                    ? "bg-foreground/10 text-foreground font-semibold"
                    : "bg-white/80 text-muted-foreground border hover:bg-muted",
                )}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {products.isLoading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
        </div>
      ) : products.isError ? (
        <div className="rounded-2xl border bg-danger-soft p-5 text-danger">
          Không thể tải sản phẩm.{" "}
          <button onClick={() => products.refetch()} className="underline">
            Thử lại
          </button>
        </div>
      ) : (products.data?.data.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-5 py-12 text-center">
          <PackageSearch className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Chưa có sản phẩm nào</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tạo sản phẩm đầu tiên để bắt đầu quản lý kho hàng.
          </p>
        </div>
      ) : (
        <>
          <DataTable
            rows={products.data?.data ?? []}
            rowKey={(row) => row.id}
            renderMobileCard={(row) => (
              <div className="rounded-2xl border bg-white p-4 shadow-xs transition active:scale-[0.99]">
                {/* Header Card: Tên SP + Mã + Status */}
                <div className="flex items-start justify-between gap-2 border-b pb-3">
                  <div className="flex-1">
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="text-base font-bold text-foreground leading-tight line-clamp-2 hover:text-primary hover:underline"
                    >
                      {row.productName}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono font-medium">{row.productCode}</span>
                      <span>•</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {typeLabels[row.type]}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={row.status} />
                </div>

                {/* Body Card: Giá & Tồn kho */}
                <div className="mt-3 grid grid-cols-2 gap-3 py-1">
                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Giá bán
                    </span>
                    <strong className="text-base font-bold text-primary tabular tracking-tight">
                      {formatVnd(row.productPrice)}
                    </strong>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Tồn kho hiện tại
                    </span>
                    <strong
                      className={cn(
                        "text-base font-bold tabular tracking-tight",
                        row.remainingQuantity <= 5 ? "text-danger" : "text-foreground",
                      )}
                    >
                      {row.remainingQuantity}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {row.productUnit}
                      </span>
                    </strong>
                  </div>
                </div>

                {/* Footer Card: Actions */}
                <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(row.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showForm(row)}
                      className="h-8 gap-1.5 text-xs font-medium"
                    >
                      <Pencil className="size-3.5" />
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(row)}
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
                key: "product",
                label: "Sản phẩm",
                render: (row) => (
                  <div>
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.productCode}</p>
                  </div>
                ),
              },
              {
                key: "type",
                label: "Loại",
                render: (row) => typeLabels[row.type],
              },
              {
                key: "price",
                label: "Giá bán",
                render: (row) => formatVnd(row.productPrice),
              },
              {
                key: "quantity",
                label: "Tồn kho",
                render: (row) => `${row.remainingQuantity} ${row.productUnit}`,
              },
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
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(row)}
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
              <span>Thêm SP</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>{products.data?.meta.total ?? 0} sản phẩm</span>
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
                Trang {page} / {products.data?.meta.totalPages ?? 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (products.data?.meta.totalPages ?? 1)}
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
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] w-full rounded-t-3xl border-t bg-white p-5 pb-8 shadow-2xl overflow-y-auto sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6 sm:border">
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="text-xl font-bold">
                  {editing ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Các trường khớp trực tiếp với Products API.
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-2 hover:bg-muted">
                <X />
              </Dialog.Close>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-sm font-medium">Mã sản phẩm</span>
                <Input
                  required
                  value={form.productCode}
                  onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Tên sản phẩm</span>
                <Input
                  required
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Giá bán (VNĐ)</span>
                <Input
                  required
                  type="number"
                  min={0}
                  value={form.productPrice}
                  onChange={(e) =>
                    setForm({ ...form, productPrice: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Đơn vị</span>
                <Input
                  required
                  placeholder="chai, gói, kg, lít..."
                  value={form.productUnit}
                  onChange={(e) => setForm({ ...form, productUnit: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Loại sản phẩm</span>
                <Select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as ProductType })
                  }
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {typeLabels[type]}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Trạng thái</span>
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as ProductStatus })
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium">Ghi chú</span>
                <Textarea
                  value={form.productNote}
                  onChange={(e) => setForm({ ...form, productNote: e.target.value })}
                />
              </label>
            </div>
            {editing && (
              <p className="mt-4 text-xs text-muted-foreground">
                Tồn kho hiện tại: {editing.remainingQuantity} {editing.productUnit} — số lượng chỉ thay đổi khi hoàn thành phiếu nhập/xuất.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Hủy</Button>
              </Dialog.Close>
              <Button
                onClick={save}
                disabled={mutations.create.isPending || mutations.update.isPending}
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
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xóa sản phẩm này?"
        description={
          deleting
            ? `Sản phẩm "${deleting.productName}" sẽ bị xóa khỏi danh mục. Hành động này không thể hoàn tác.`
            : ""
        }
        confirmLabel="Xóa sản phẩm"
        loading={mutations.remove.isPending}
        onConfirm={remove}
      />
    </Page>
  );
}
