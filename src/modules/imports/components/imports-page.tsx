"use client";

import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatVnd } from "@/lib/format";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã phiếu nhập, mã hoặc tên sản phẩm..."
            className="pl-10"
          />
        </div>

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

      {/* Content */}
      {importsQuery.isLoading ? (
        <div className="h-64 rounded-2xl skeleton" />
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
                  const lineList = row.items && row.items.length > 0 ? row.items : [row];
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
                  const lineList = row.items && row.items.length > 0 ? row.items : [row];
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
                render: (row) => formatVnd(row.importPrice),
              },
              {
                key: "total",
                label: "Tổng tiền",
                render: (row) => (
                  <strong className="font-mono text-primary">
                    {formatVnd(row.totalPrice)}
                  </strong>
                ),
              },
              {
                key: "expire",
                label: "Hạn sử dụng",
                render: (row) =>
                  row.expireDate
                    ? new Date(row.expireDate).toLocaleDateString("vi-VN")
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
                        title="Hủy phiếu nhập"
                        className="text-danger hover:text-danger"
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

          {/* Phân trang */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {meta ? `${meta.total} phiếu nhập kho` : "0 phiếu"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((v) => v - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= (meta?.totalPages ?? 1)}
                onClick={() => setPage((v) => v + 1)}
              >
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
