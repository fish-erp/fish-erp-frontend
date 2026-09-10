"use client";

import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageMinus,
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
import { CreateExportDialog } from "./create-export-dialog";
import { PaymentSummary } from "./payment-panel";
import { ExportDetailDialog } from "./export-detail-dialog";
import { useExportMutations, useExports } from "../hooks/use-exports";
import type { ExportInvoice, ExportStatus } from "../types/export";

export function ExportsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ExportStatus | "">("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ExportInvoice | null>(null);
  const [viewing, setViewing] = useState<ExportInvoice | null>(null);
  const [action, setAction] = useState<{
    type: "complete" | "cancel" | "delete";
    id: string;
  } | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const list = useExports({
    page,
    limit: 20,
    ...(query ? { search: query } : {}),
    ...(status ? { exportStatus: status } : {}),
  });
  const mutations = useExportMutations();

  const confirm = async () => {
    if (!action) return;
    try {
      if (action.type === "complete")
        await mutations.complete.mutateAsync(action.id);
      if (action.type === "cancel")
        await mutations.cancel.mutateAsync(action.id);
      if (action.type === "delete")
        await mutations.remove.mutateAsync(action.id);
      toast.success(
        action.type === "complete"
          ? "Đã hoàn tất và trừ tồn kho"
          : action.type === "cancel"
            ? "Đã hủy và hoàn lại tồn kho"
            : "Đã xóa phiếu xuất",
      );
      setAction(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xử lý phiếu xuất",
      );
    }
  };

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  return (
    <Page
      title="Quản lý xuất hàng"
      description="Tạo hóa đơn nhiều sản phẩm và kiểm soát tồn kho khi hoàn tất."
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="size-4" />
          Tạo phiếu xuất
        </Button>
      }
    >
      {/* Bộ lọc và tìm kiếm */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-10 h-10 rounded-xl bg-white shadow-2xs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã phiếu, khách hàng hoặc sản phẩm..."
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

        {/* Desktop Select */}
        <div className="hidden sm:block">
          <Select
            className="sm:w-52"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ExportStatus | "");
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="EDITING">Lưu nháp</option>
            <option value="CANCELLED">Đã hủy</option>
          </Select>
        </div>

        {/* Mobile Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs sm:hidden">
          {[
            { value: "", label: "Tất cả trạng thái" },
            { value: "COMPLETED", label: "Đã hoàn thành" },
            { value: "EDITING", label: "Lưu nháp" },
            { value: "CANCELLED", label: "Đã hủy" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setStatus(item.value as ExportStatus | "");
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 font-medium transition active:scale-95",
                status === item.value
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-muted-foreground border hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {list.isError ? (
        <p role="alert" className="text-danger">
          Không tải được phiếu xuất. <button onClick={() => void list.refetch()}>Thử lại</button>
        </p>
      ) : list.isLoading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-14 text-center">
          <PackageMinus className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Chưa có phiếu xuất hàng</h3>
        </div>
      ) : (
        <>
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            renderMobileCard={(row) => (
              <div className="rounded-2xl border bg-white p-4 shadow-xs transition active:scale-[0.99]">
                {/* Header: Mã hóa đơn & Status */}
                <div className="flex items-start justify-between gap-2 border-b pb-3">
                  <div>
                    <button
                      onClick={() => setViewing(row)}
                      className="font-mono text-base font-bold text-primary hover:underline text-left block"
                    >
                      {row.invoiceCode}
                    </button>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(row.completedAt ?? row.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={row.exportStatus} />
                </div>

                {/* Body: Khách hàng, Sản phẩm & Tài chính */}
                <div className="mt-3 space-y-2.5">
                  {/* Khách hàng */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">
                      {row.customerName || "Khách lẻ"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {row.customerPhone || (row.exportType === "DELIVERY" ? "Giao hàng" : "Bán tại nhà")}
                    </span>
                  </div>

                  {/* Mặt hàng */}
                  <div className="rounded-xl bg-muted/40 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span>Sản phẩm ({row.totalQuantity} đơn vị)</span>
                      <span className="text-[11px]">{row.items.length} mặt hàng</span>
                    </div>
                    <p className="font-medium text-foreground line-clamp-1">
                      {row.items.slice(0, 2).map((item) => item.product.productName).join(", ")}
                      {row.items.length > 2 ? ` (+${row.items.length - 2} món khác)` : ""}
                    </p>
                  </div>

                  {/* Tiền & Thanh toán */}
                  <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/15 p-2.5">
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Tổng tiền hóa đơn
                      </span>
                      <strong className="text-base font-bold text-primary tabular tracking-tight">
                        {formatVnd(row.totalAmount)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <PaymentSummary invoice={row} />
                    </div>
                  </div>

                  {row.exportNote && (
                    <p className="text-xs text-muted-foreground italic line-clamp-1">
                      Ghi chú: {row.exportNote}
                    </p>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewing(row)}
                      className="h-8 gap-1 text-xs"
                    >
                      <Eye className="size-3.5" />
                      Xem
                    </Button>

                    {row.exportStatus === "EDITING" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(row);
                            setEditorOpen(true);
                          }}
                          className="h-8 gap-1 text-xs"
                        >
                          <Pencil className="size-3.5" />
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setAction({ type: "complete", id: row.id })}
                          className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Hoàn tất
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {row.exportStatus !== "CANCELLED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAction({ type: "cancel", id: row.id })}
                        className="h-8 text-xs text-amber-600 hover:bg-amber-50"
                      >
                        Hủy
                      </Button>
                    )}
                    {row.exportStatus !== "COMPLETED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAction({ type: "delete", id: row.id })}
                        className="h-8 text-xs text-danger hover:bg-danger-soft"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            columns={[
              {
                key: "code",
                label: "Mã phiếu",
                render: (row) => (
                  <button
                    className="font-mono font-semibold text-primary hover:underline"
                    onClick={() => setViewing(row)}
                  >
                    {row.invoiceCode}
                    <span className="block font-sans text-xs font-normal text-muted-foreground">
                      {formatDateTime(row.completedAt ?? row.createdAt)}
                    </span>
                  </button>
                ),
              },
              {
                key: "customer",
                label: "Khách hàng",
                render: (row) => (
                  <div>
                    {row.customerName || "Khách lẻ"}
                    <p className="text-xs text-muted-foreground">
                      {row.customerPhone ||
                        (row.exportType === "DELIVERY"
                          ? "Giao hàng"
                          : "Bán tại nhà")}
                    </p>
                  </div>
                ),
              },
              {
                key: "items",
                label: "Sản phẩm",
                render: (row) => (
                  <div>
                    {row.items
                      .slice(0, 2)
                      .map((item) => item.product.productName)
                      .join(", ")}
                    {row.items.length > 2 ? ` (+${row.items.length - 2})` : ""}
                    <p className="text-xs text-muted-foreground">
                      {row.totalQuantity} đơn vị
                    </p>
                  </div>
                ),
              },
              {
                key: "amount",
                label: "Tổng tiền",
                render: (row) => (
                  <strong className="text-primary">
                    {formatVnd(row.totalAmount)}
                  </strong>
                ),
              },
              {
                key: "payment",
                label: "Thanh toán",
                render: (row) => <PaymentSummary invoice={row} />,
              },
              {
                key: "note",
                label: "Ghi chú",
                className: "max-w-64",
                render: (row) => (
                  <p
                    className="line-clamp-2 whitespace-pre-wrap break-words text-muted-foreground"
                    title={row.exportNote ?? undefined}
                  >
                    {row.exportNote || "—"}
                  </p>
                ),
              },
              {
                key: "status",
                label: "Trạng thái",
                render: (row) => <StatusBadge status={row.exportStatus} />,
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
                      title="Xem"
                      onClick={() => setViewing(row)}
                    >
                      <Eye className="size-4" />
                    </Button>
                    {row.exportStatus === "EDITING" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Sửa"
                          onClick={() => {
                            setEditing(row);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hoàn tất"
                          className="text-success"
                          onClick={() =>
                            setAction({ type: "complete", id: row.id })
                          }
                        >
                          <CheckCircle2 className="size-4" />
                        </Button>
                      </>
                    )}
                    {row.exportStatus !== "CANCELLED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Hủy"
                        className="text-danger"
                        onClick={() => setAction({ type: "cancel", id: row.id })}
                      >
                        <Ban className="size-4" />
                      </Button>
                    )}
                    {row.exportStatus !== "COMPLETED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa"
                        onClick={() => setAction({ type: "delete", id: row.id })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />

          {/* Floating Action Button for Mobile */}
          <div className="fixed bottom-20 right-4 z-30 lg:hidden">
            <button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xl transition active:scale-95"
            >
              <Plus className="size-5" />
              <span>Xuất hàng</span>
            </button>
          </div>

          {/* Phân trang */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
              <span>{meta.total} phiếu xuất</span>
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
                  Trang {page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="h-9 px-3 text-xs"
                >
                  <span className="hidden sm:inline">Sau</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <CreateExportDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
      />
      <ExportDetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        invoice={viewing}
      />
      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => !open && setAction(null)}
        title={
          action?.type === "complete"
            ? "Hoàn tất phiếu xuất?"
            : action?.type === "cancel"
              ? "Hủy phiếu xuất?"
              : "Xóa phiếu xuất?"
        }
        description={
          action?.type === "complete"
            ? "Tồn kho sẽ bị trừ ngay và ghi nhận thanh toán theo thông tin lưu trong phiếu nháp."
            : action?.type === "cancel"
              ? "Nếu phiếu đã hoàn thành, hàng sẽ được hoàn lại kho. Các khoản thu phải được hoàn/đảo trước trong chi tiết phiếu."
              : "Phiếu sẽ được xóa mềm."
        }
        confirmLabel="Xác nhận"
        onConfirm={() => void confirm()}
      />
    </Page>
  );
}
