"use client";

import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateImportDialog } from "@/modules/imports/components/create-import-dialog";
import { ImportDetailDialog } from "@/modules/imports/components/import-detail-dialog";
import {
  useImportMutations,
  useImports,
} from "@/modules/imports/hooks/use-imports";
import type {
  ImportProductItem,
  ImportStatus,
} from "@/modules/imports/types/import";

const statusFilterOptions: { value: ImportStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
  { value: "DRAFT", label: "Lưu nháp" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export function ImportsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ImportStatus | "">("");

  // Dialog states
  const [openCreate, setOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<ImportProductItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ImportProductItem | null>(null);

  // Confirm actions
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const importsQuery = useImports({
    page,
    limit: 20,
    ...(query ? { search: query } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const mutations = useImportMutations();

  const handleComplete = async () => {
    if (!completingId) return;
    try {
      await mutations.complete.mutateAsync(completingId);
      toast.success("Đã hoàn thành phiếu nhập kho và cộng tồn kho");
      setCompletingId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể hoàn thành phiếu",
      );
    }
  };

  const handleCancel = async () => {
    if (!cancellingId) return;
    try {
      await mutations.cancel.mutateAsync(cancellingId);
      toast.success("Đã hủy phiếu nhập kho và hoàn trừ tồn kho");
      setCancellingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể hủy phiếu");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await mutations.remove.mutateAsync(deletingId);
      toast.success("Đã xóa phiếu nhập kho");
      setDeletingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa phiếu");
    }
  };

  const items = importsQuery.data?.data ?? [];
  const meta = importsQuery.data?.meta;

  return (
    <Page
      title="Quản lý nhập kho"
      description="Quản lý phiếu nhập kho hàng hóa, kiểm soát số lượng nhập và cập nhật tồn kho tự động."
      actions={
        <Button
          onClick={() => {
            setEditingItem(null);
            setOpenCreate(true);
          }}
          className="gap-2"
        >
          <Plus className="size-4" />
          Tạo phiếu nhập
        </Button>
      }
    >
      {/* Bộ lọc và tìm kiếm */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã phiếu, mã hoặc tên sản phẩm..."
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

        {/* Desktop Select Dropdown */}
        <div className="hidden sm:block">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ImportStatus | "");
              setPage(1);
            }}
            className="sm:w-52"
          >
            {statusFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Mobile Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs sm:hidden">
          {statusFilterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 font-medium transition active:scale-95",
                statusFilter === opt.value
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-muted-foreground border hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {importsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
        </div>
      ) : importsQuery.isError ? (
        <div className="rounded-2xl border bg-danger-soft p-5 text-danger">
          Không thể tải danh sách phiếu nhập kho.{" "}
          <button
            onClick={() => importsQuery.refetch()}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-5 py-14 text-center">
          <PackageSearch className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            Chưa có phiếu nhập kho nào
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Bắt đầu nhập lô hàng mới bằng cách bấm vào nút &quot;Tạo phiếu nhập&quot;.
          </p>
          <Button
            onClick={() => {
              setEditingItem(null);
              setOpenCreate(true);
            }}
            className="mt-4 gap-2"
          >
            <Plus className="size-4" />
            Tạo phiếu nhập đầu tiên
          </Button>
        </div>
      ) : (
        <>
          <DataTable
            rows={items}
            rowKey={(row) => row.id}
            renderMobileCard={(row) => {
              const lineList = row.items;
              const totalQty = lineList.reduce((sum, l) => sum + l.importQuantity, 0);

              return (
                <div className="rounded-2xl border bg-white p-4 shadow-xs transition active:scale-[0.99]">
                  {/* Header: Mã phiếu & Status */}
                  <div className="flex items-start justify-between gap-2 border-b pb-3">
                    <div>
                      <button
                        onClick={() => setViewingItem(row)}
                        className="font-mono text-base font-bold text-primary hover:underline text-left block"
                      >
                        {row.importCode}
                      </button>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </span>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>

                  {/* Body: Sản phẩm nhập + Số lượng + Tổng tiền */}
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">
                      {lineList.length === 1 && lineList[0]?.product ? (
                        <div>
                          <p className="font-semibold text-foreground">
                            {lineList[0].product.productName}
                          </p>
                          <span className="text-xs font-mono text-muted-foreground">
                            {lineList[0].product.productCode}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-foreground line-clamp-1">
                            {lineList
                              .map((i) => i.product?.productName)
                              .filter(Boolean)
                              .slice(0, 2)
                              .join(", ")}
                            {lineList.length > 2 ? ` (+${lineList.length - 2})` : ""}
                          </p>
                          <span className="text-xs font-medium text-primary">
                            Gồm {lineList.length} mặt hàng nhập
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-xl bg-muted/40 p-2.5">
                        <span className="text-[11px] font-medium text-muted-foreground block">
                          Tổng số lượng
                        </span>
                        <strong className="text-sm font-bold text-foreground">
                          {totalQty}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {lineList.length === 1 && lineList[0]?.product
                              ? lineList[0].product.productUnit
                              : "đơn vị"}
                          </span>
                        </strong>
                      </div>

                      <div className="rounded-xl bg-muted/40 p-2.5">
                        <span className="text-[11px] font-medium text-muted-foreground block">
                          Tổng tiền nhập
                        </span>
                        <strong className="text-sm font-bold text-primary tabular tracking-tight">
                          {formatVnd(row.totalAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Action Bar */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingItem(row)}
                        className="h-8 gap-1 text-xs"
                      >
                        <Eye className="size-3.5" />
                        Xem
                      </Button>

                      {row.status === "DRAFT" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(row);
                              setOpenCreate(true);
                            }}
                            className="h-8 gap-1 text-xs"
                          >
                            <Pencil className="size-3.5" />
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setCompletingId(row.id)}
                            className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Duyệt
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {row.status !== "CANCELLED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancellingId(row.id)}
                          className="h-8 text-xs text-amber-600 hover:bg-amber-50"
                        >
                          Hủy
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(row.id)}
                        className="h-8 text-xs text-danger hover:bg-danger-soft"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }}
            columns={[
              {
                key: "code",
                label: "Mã phiếu",
                render: (row) => (
                  <div>
                    <button
                      onClick={() => setViewingItem(row)}
                      className="font-mono font-medium text-primary hover:underline text-left"
                    >
                      {row.importCode}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </p>
                  </div>
                ),
              },
              {
                key: "product",
                label: "Sản phẩm nhập",
                render: (row) => {
                  const lineList = row.items;
                  if (lineList.length === 1 && lineList[0]?.product) {
                    return (
                      <div>
                        <span className="font-medium text-foreground">
                          {lineList[0].product.productName}
                        </span>
                        <p className="text-xs font-mono text-muted-foreground">
                          {lineList[0].product.productCode}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <span className="font-medium text-foreground">
                        {lineList
                          .map((i) => i.product?.productName)
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(", ")}
                        {lineList.length > 2 ? ` (+${lineList.length - 2} sản phẩm)` : ""}
                      </span>
                      <p className="text-xs text-primary font-medium">
                        Gồm {lineList.length} mặt hàng trong phiếu
                      </p>
                    </div>
                  );
                },
              },
              {
                key: "quantity",
                label: "Số lượng nhập",
                render: (row) => {
                  const lineList = row.items;
                  const totalQty = lineList.reduce((sum, l) => sum + l.importQuantity, 0);
                  if (lineList.length === 1 && lineList[0]?.product) {
                    return (
                      <strong className="text-foreground">
                        {totalQty} {lineList[0].product.productUnit}
                      </strong>
                    );
                  }
                  return (
                    <div>
                      <strong className="text-foreground">{totalQty} đơn vị</strong>
                      <p className="text-xs text-muted-foreground">{lineList.length} dòng sản phẩm</p>
                    </div>
                  );
                },
              },
              {
                key: "price",
                label: "Đơn giá nhập",
                render: (row) => row.items.length === 1
                  ? formatVnd(row.items[0]?.importPrice ?? 0)
                  : `${row.items.length} mức giá`,
              },
              {
                key: "total",
                label: "Tổng tiền",
                render: (row) => (
                  <strong className="font-mono text-primary">
                    {formatVnd(row.totalAmount)}
                  </strong>
                ),
              },
              {
                key: "expire",
                label: "Hạn sử dụng",
                render: (row) =>
                  row.items[0]?.expireDate
                    ? new Date(row.items[0].expireDate).toLocaleDateString("vi-VN")
                    : "—",
              },
              {
                key: "status",
                label: "Trạng thái",
                render: (row) => <StatusBadge status={row.status} />,
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
                      onClick={() => setViewingItem(row)}
                      title="Xem chi tiết"
                    >
                      <Eye className="size-4" />
                    </Button>

                    {row.status === "DRAFT" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingItem(row);
                            setOpenCreate(true);
                          }}
                          title="Sửa phiếu nháp"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCompletingId(row.id)}
                          title="Hoàn thành & cộng kho"
                          className="text-success hover:text-success"
                        >
                          <CheckCircle2 className="size-4" />
                        </Button>
                      </>
                    )}

                    {row.status !== "CANCELLED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCancellingId(row.id)}
                        title="Hủy phiếu"
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Ban className="size-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(row.id)}
                      title="Xóa phiếu"
                      className="text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          {/* Floating Action Button for Mobile */}
          <div className="fixed bottom-20 right-4 z-30 lg:hidden">
            <button
              onClick={() => {
                setEditingItem(null);
                setOpenCreate(true);
              }}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xl transition active:scale-95"
            >
              <Plus className="size-5" />
              <span>Nhập kho</span>
            </button>
          </div>

          {/* Phân trang */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>
              {meta ? `${meta.total} phiếu nhập` : "0 phiếu"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((v) => v - 1)}
                className="h-9 px-3 text-xs"
              >
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Trước</span>
              </Button>
              <span className="text-xs font-medium px-2">
                Trang {page} / {meta?.totalPages ?? 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (meta?.totalPages ?? 1)}
                onClick={() => setPage((v) => v + 1)}
                className="h-9 px-3 text-xs"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Dialog Tạo / Sửa phiếu nhập */}
      <CreateImportDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        editingImport={editingItem}
      />

      {/* Dialog Xem chi tiết */}
      <ImportDetailDialog
        item={viewingItem}
        open={Boolean(viewingItem)}
        onOpenChange={(open) => !open && setViewingItem(null)}
        onComplete={(id) => setCompletingId(id)}
        onCancel={(id) => setCancellingId(id)}
      />

      {/* Confirm Hoàn thành */}
      <ConfirmDialog
        open={Boolean(completingId)}
        onOpenChange={(open) => !open && setCompletingId(null)}
        title="Xác nhận hoàn thành nhập kho?"
        description="Khi hoàn thành, số lượng nhập sẽ được cộng trực tiếp vào tồn kho của sản phẩm trong kho hàng."
        confirmLabel="Hoàn thành nhập kho"
        loading={mutations.complete.isPending}
        onConfirm={handleComplete}
      />

      {/* Confirm Hủy */}
      <ConfirmDialog
        open={Boolean(cancellingId)}
        onOpenChange={(open) => !open && setCancellingId(null)}
        title="Xác nhận hủy phiếu nhập kho?"
        description="Nếu phiếu nhập đã hoàn thành trước đó, số lượng đã nhập sẽ bị trừ hoàn lại khỏi tồn kho của sản phẩm."
        confirmLabel="Hủy phiếu nhập"
        loading={mutations.cancel.isPending}
        onConfirm={handleCancel}
      />

      {/* Confirm Xóa */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa phiếu nhập kho?"
        description="Phiếu nhập sẽ bị xóa mềm khỏi hệ thống. Nếu phiếu này từng hoàn thành, tồn kho sẽ được hoàn trả lại."
        confirmLabel="Xóa phiếu"
        loading={mutations.remove.isPending}
        onConfirm={handleDelete}
      />
    </Page>
  );
}
