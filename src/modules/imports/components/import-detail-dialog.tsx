"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatVnd } from "@/lib/format";
import type { ImportProductItem } from "@/modules/imports/types/import";

interface ImportDetailDialogProps {
  item: ImportProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ImportDetailDialog({
  item,
  open,
  onOpenChange,
  onComplete,
  onCancel,
}: ImportDetailDialogProps) {
  if (!item) return null;

  const lineItems = item.items && item.items.length > 0 ? item.items : [item];
  const totalQty = lineItems.reduce((sum, l) => sum + l.importQuantity, 0);
  const grandTotal = lineItems.reduce((sum, l) => sum + l.totalPrice, 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between border-b pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Dialog.Title className="text-lg font-bold text-foreground">
                  Chi tiết phiếu nhập kho
                </Dialog.Title>
                <StatusBadge status={item.status} />
              </div>
              <Dialog.Description className="mt-1 font-mono text-xs text-muted-foreground">
                Mã phiếu: <strong>{item.importCode}</strong>
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-2 hover:bg-muted">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="mt-4 space-y-4">
            {/* Danh sách các sản phẩm */}
            <div className="rounded-xl border overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Package className="size-4" />
                Danh sách mặt hàng nhập ({lineItems.length} sản phẩm)
              </div>
              <div className="divide-y">
                {lineItems.map((line, idx) => (
                  <div key={line.id} className="p-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {idx + 1}. {line.product?.productName ?? "Sản phẩm"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {line.product?.productCode}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                        <span>Đơn giá: {formatVnd(line.importPrice)}</span>
                        {line.expireDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" /> HSD: {new Date(line.expireDate).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                        {line.importNote && <span className="italic">Ghi chú: {line.importNote}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-foreground">
                        {line.importQuantity} {line.product?.productUnit ?? "đơn vị"}
                      </div>
                      <div className="font-mono font-bold text-primary text-xs">
                        = {formatVnd(line.totalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/20 p-3 border-t flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Tổng cộng: {totalQty} đơn vị
                </span>
                <span className="font-mono text-base font-bold text-primary">
                  {formatVnd(grandTotal)}
                </span>
              </div>
            </div>

            {/* Ghi chú chung phiếu nhập */}
            {item.importNote && (
              <div className="rounded-xl border bg-muted/10 p-3 text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="size-3.5" /> Ghi chú phiếu:
                </span>
                <p className="mt-1 text-foreground">{item.importNote}</p>
              </div>
            )}

            {/* Dấu thời gian */}
            <div className="rounded-xl border bg-muted/10 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> Ngày tạo phiếu:
                </span>
                <span>{formatDateTime(item.createdAt)}</span>
              </div>
              {item.completedAt && (
                <div className="flex items-center justify-between text-success">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Hoàn thành nhập kho lúc:
                  </span>
                  <span>{formatDateTime(item.completedAt)}</span>
                </div>
              )}
              {item.cancelledAt && (
                <div className="flex items-center justify-between text-danger">
                  <span className="flex items-center gap-1">
                    <Ban className="size-3.5" /> Đã hủy phiếu lúc:
                  </span>
                  <span>{formatDateTime(item.cancelledAt)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t pt-3">
              {item.status === "DRAFT" && onComplete && (
                <Button
                  type="button"
                  onClick={() => {
                    onComplete(item.id);
                    onOpenChange(false);
                  }}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="size-4" />
                  Hoàn thành phiếu (+ Tồn kho)
                </Button>
              )}

              {item.status !== "CANCELLED" && onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onCancel(item.id);
                    onOpenChange(false);
                  }}
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                >
                  <Ban className="size-4" />
                  Hủy phiếu nhập (- Tồn kho)
                </Button>
              )}

              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
