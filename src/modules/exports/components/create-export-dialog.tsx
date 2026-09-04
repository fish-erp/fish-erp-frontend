"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, PackageMinus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatVnd } from "@/lib/format";
import { ProductSearchCombobox } from "@/modules/imports/components/product-search-combobox";
import type { Product } from "@/modules/products/types/product";
import { useExportMutations } from "../hooks/use-exports";
import type { ExportInvoice, ExportStatus, ExportType } from "../types/export";

interface LineState {
  id: string;
  product: Product | null;
  quantity: number | "";
  note: string;
}

const emptyLine = (): LineState => ({
  id: crypto.randomUUID(),
  product: null,
  quantity: "",
  note: "",
});

export function CreateExportDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: ExportInvoice | null;
}) {
  const mutations = useExportMutations();
  const [invoiceCode, setInvoiceCode] = useState("");
  const [exportType, setExportType] = useState<ExportType>("AT_HOME");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [exportNote, setExportNote] = useState("");
  const [lines, setLines] = useState<LineState[]>([emptyLine()]);

  useEffect(() => {
    if (!open) return;
    // Form state is intentionally hydrated only when the dialog opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInvoiceCode(editing?.invoiceCode ?? "");
    setExportType(editing?.exportType ?? "AT_HOME");
    setCustomerName(editing?.customerName ?? "");
    setCustomerPhone(editing?.customerPhone ?? "");
    setDeliveryAddress(editing?.deliveryAddress ?? "");
    setExportNote(editing?.exportNote ?? "");
    setLines(editing?.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.exportQuantity,
      note: item.lineNote ?? "",
    })) ?? [emptyLine()]);
  }, [open, editing]);

  const updateLine = (index: number, patch: Partial<LineState>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  const save = async (exportStatus: ExportStatus) => {
    if (lines.some((line) => !line.product || !Number.isInteger(Number(line.quantity)) || Number(line.quantity) <= 0)) {
      toast.error("Vui lòng chọn sản phẩm và nhập số lượng nguyên dương cho tất cả dòng");
      return;
    }
    const productIds = lines.map((line) => line.product!.id);
    if (new Set(productIds).size !== productIds.length) {
      toast.error("Mỗi sản phẩm chỉ được chọn một lần trong phiếu xuất");
      return;
    }
    if (exportStatus === "COMPLETED") {
      const insufficient = lines.find((line) => Number(line.quantity) > line.product!.remainingQuantity);
      if (insufficient) {
        toast.error(`${insufficient.product!.productName} không đủ tồn kho`);
        return;
      }
    }
    const input = {
      ...(invoiceCode.trim() ? { invoiceCode: invoiceCode.trim() } : {}),
      exportType,
      exportStatus,
      ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
      ...(customerPhone.trim() ? { customerPhone: customerPhone.trim() } : {}),
      ...(deliveryAddress.trim() ? { deliveryAddress: deliveryAddress.trim() } : {}),
      ...(exportNote.trim() ? { exportNote: exportNote.trim() } : {}),
      items: lines.map((line) => ({
        productId: line.product!.id,
        exportQuantity: Number(line.quantity),
        ...(line.note.trim() ? { lineNote: line.note.trim() } : {}),
      })),
    };
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, input });
      else await mutations.create.mutateAsync(input);
      toast.success(exportStatus === "COMPLETED" ? "Đã xuất kho thành công" : "Đã lưu phiếu xuất nháp");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu phiếu xuất");
    }
  };

  const pending = mutations.create.isPending || mutations.update.isPending;
  const totalQuantity = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const totalAmount = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (line.product?.productPrice ?? 0), 0);

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[94vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b pb-3">
          <div><Dialog.Title className="flex items-center gap-2 text-xl font-bold text-primary"><PackageMinus />{editing ? "Chỉnh sửa phiếu xuất" : "Tạo phiếu xuất hàng"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Chọn nhiều sản phẩm; tồn kho chỉ bị trừ khi hoàn tất phiếu.</Dialog.Description></div>
          <Dialog.Close className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></Dialog.Close>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-xs font-semibold">Mã phiếu (tùy chọn)</span><Input value={invoiceCode} onChange={(event) => setInvoiceCode(event.target.value)} placeholder="Tự sinh INV-..." /></label>
          <label><span className="mb-1 block text-xs font-semibold">Kiểu xuất</span><Select value={exportType} onChange={(event) => setExportType(event.target.value as ExportType)}><option value="AT_HOME">Bán tại nhà</option><option value="DELIVERY">Giao hàng</option></Select></label>
          <label><span className="mb-1 block text-xs font-semibold">Khách hàng</span><Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
          <label><span className="mb-1 block text-xs font-semibold">Số điện thoại</span><Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label>
          {exportType === "DELIVERY" && <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Địa chỉ giao hàng</span><Input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} /></label>}
          <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Ghi chú chung</span><Textarea value={exportNote} onChange={(event) => setExportNote(event.target.value)} /></label>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between"><strong className="text-sm">Danh sách sản phẩm ({lines.length})</strong><Button variant="outline" size="sm" onClick={() => setLines((current) => [...current, emptyLine()])}><Plus className="size-4" />Thêm sản phẩm</Button></div>
          {lines.map((line, index) => <div key={line.id} className="rounded-xl border bg-card p-3">
            <div className="mb-2 flex items-center justify-between"><strong className="text-xs text-muted-foreground">Mặt hàng #{index + 1}</strong>{lines.length > 1 && <Button variant="ghost" size="sm" className="text-danger" onClick={() => setLines((current) => current.filter((_, i) => i !== index))}><Trash2 className="size-4" />Xóa</Button>}</div>
            <ProductSearchCombobox mode="export" selectedProduct={line.product} onSelect={(product) => updateLine(index, { product })} disabled={pending} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label><span className="mb-1 block text-xs font-semibold">Số lượng {line.product ? `(${line.product.productUnit})` : ""}</span><Input type="number" min={1} step={1} value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value === "" ? "" : Number(event.target.value) })} /></label>
              <label><span className="mb-1 block text-xs font-semibold">Ghi chú dòng</span><Input value={line.note} onChange={(event) => updateLine(index, { note: event.target.value })} /></label>
            </div>
            {line.product && <p className="mt-2 text-right text-sm text-muted-foreground">Tạm tính: <strong className="text-primary">{formatVnd((Number(line.quantity) || 0) * line.product.productPrice)}</strong></p>}
          </div>)}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm"><span className="text-muted-foreground">Tổng {totalQuantity} đơn vị · </span><strong className="text-primary">{formatVnd(totalAmount)}</strong></div><div className="flex gap-2"><Button variant="outline" disabled={pending} onClick={() => void save("EDITING")}>Lưu nháp</Button><Button disabled={pending} onClick={() => void save("COMPLETED")}>{pending && <LoaderCircle className="animate-spin" />}Hoàn tất & xuất kho</Button></div></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
