"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, PackageMinus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatMoneyPreview, formatVnd } from "@/lib/format";
import { clientId } from "@/lib/client-id";
import { CustomerPicker } from "@/modules/customers/customer-picker";
import type { Customer } from "@/modules/customers/customers";
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
  id: clientId(),
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
  const [lines, setLines] = useState<LineState[]>(() => [emptyLine()]);
  const [customer, setCustomer] = useState<(Partial<Customer> & Pick<Customer, "id" | "name" | "phoneNumber">) | null>(null);
  const [paidInFull, setPaidInFull] = useState(true);
  const [paidAmount, setPaidAmount] = useState<number | "">(0);

  useEffect(() => {
    if (!open) return;
    // Form state is intentionally hydrated only when the dialog opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInvoiceCode(editing?.invoiceCode ?? "");
    setExportType(editing?.exportType ?? "AT_HOME");
    setCustomerName(editing?.customerName ?? "");
    setCustomerPhone(editing?.customerPhone ?? "");
    setCustomer(editing?.customerId ? { id: editing.customerId, name: editing.customerName ?? "Khách hàng", phoneNumber: editing.customerPhone ?? "" } : null);
    setPaidInFull(editing?.paidAmount == null || editing?.paidAmount === editing?.totalAmount);
    setPaidAmount(editing?.paidAmount ?? 0);
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
    if (pending) return;
    if (!paidInFull && (!customer || paidAmount === "" || !Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > totalAmount)) {
      toast.error("Chọn khách hàng và nhập số tiền đã trả từ 0 đến tổng tiền"); return;
    }
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
      customerId: customer?.id ?? null,
      paidAmount: paidInFull ? totalAmount : Number(paidAmount),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      exportNote: exportNote.trim(),
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

  return <Dialog.Root open={open} onOpenChange={value => { if (!pending) onOpenChange(value); }}>
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
          <div className="sm:col-span-2"><CustomerPicker selected={customer} disabled={pending} onSelect={c => { setCustomer(c); setCustomerName(c?.name ?? ""); setCustomerPhone(c?.phoneNumber ?? ""); if (c?.address) setDeliveryAddress(c.address); }} /></div>
          {!customer && customerName && <p className="text-xs text-muted-foreground sm:col-span-2">Thông tin phiếu cũ: {customerName} · {customerPhone}. Chọn hồ sơ khách để theo dõi công nợ.</p>}
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

        <section className="mt-5 rounded-xl border bg-secondary/40 p-4">
          <h3 className="font-semibold">Thanh toán khi hoàn tất</h3>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={paidInFull} disabled={pending} onChange={e => setPaidInFull(e.target.checked)} />
            Đã trả đủ
          </label>
          {!paidInFull && (
            <div className="mt-3">
              <label className="block text-sm">
                Khách trả trước (đ)
                <Input
                  type="number"
                  min={0}
                  max={totalAmount}
                  step="any"
                  value={paidAmount}
                  disabled={pending}
                  onChange={e => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </label>
              {Number(paidAmount) > 0 && (
                <p className="mt-1 text-xs font-semibold text-primary">
                  👉 {formatMoneyPreview(Number(paidAmount))}
                </p>
              )}
            </div>
          )}
          {customer && (customer.advanceAmount ?? 0) > 0 && (
            <p className="mt-2 rounded-lg border border-emerald-300/40 bg-emerald-500/10 p-2 text-xs font-medium text-emerald-700">
              💡 Khách hàng đang có <strong>{formatVnd(customer.advanceAmount ?? 0)}</strong> tiền trả trước sẵn trong tài khoản.
            </p>
          )}
          <p className="mt-2 text-sm">Còn nợ đơn này: <strong>{formatVnd(paidInFull ? 0 : Math.max(0, totalAmount - Number(paidAmount)))}</strong></p>
          <p className="mt-1 text-xs text-muted-foreground">Phiếu nháp chưa ghi nhận thu tiền. Giá và công nợ được chốt khi hoàn tất.</p>
        </section>
        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm"><span className="text-muted-foreground">Tổng {totalQuantity} đơn vị · </span><strong className="text-primary">{formatVnd(totalAmount)}</strong></div><div className="flex gap-2"><Button variant="outline" disabled={pending} onClick={() => void save("EDITING")}>Lưu nháp</Button><Button disabled={pending} onClick={() => void save("COMPLETED")}>{pending && <LoaderCircle className="animate-spin" />}Hoàn tất & xuất kho</Button></div></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
