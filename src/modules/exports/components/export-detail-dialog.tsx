"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X } from "lucide-react";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatVnd } from "@/lib/format";
import type { ExportInvoice } from "../types/export";

export function ExportDetailDialog({ invoice, open, onOpenChange }: { invoice: ExportInvoice | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [includePrice, setIncludePrice] = useState(false);
  const locale = useLocale();
  if (!invoice) return null;
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
    <div className="flex justify-between border-b pb-3"><div><Dialog.Title className="text-xl font-bold text-primary">{invoice.invoiceCode}</Dialog.Title><Dialog.Description className="text-sm text-muted-foreground">{formatDateTime(invoice.completedAt ?? invoice.createdAt)} · {invoice.exportType === "DELIVERY" ? "Giao hàng" : "Bán tại nhà"}</Dialog.Description></div><Dialog.Close className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></Dialog.Close></div>
    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Khách hàng:</span> {invoice.customerName || "—"}</p><p><span className="text-muted-foreground">Điện thoại:</span> {invoice.customerPhone || "—"}</p>{invoice.deliveryAddress && <p className="sm:col-span-2"><span className="text-muted-foreground">Địa chỉ:</span> {invoice.deliveryAddress}</p>}</div>
    <div className="mt-4 overflow-hidden rounded-xl border"><table className="w-full text-sm"><thead className="bg-secondary text-left"><tr><th className="p-3">Sản phẩm</th><th className="p-3 text-right">Số lượng</th><th className="p-3 text-right">Thành tiền</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.id} className="border-t"><td className="p-3"><strong>{item.product.productName}</strong><p className="text-xs text-muted-foreground">{item.product.productCode}</p></td><td className="p-3 text-right">{item.exportQuantity} {item.product.productUnit}</td><td className="p-3 text-right">{formatVnd((item.unitPrice ?? item.product.productPrice) * item.exportQuantity)}</td></tr>)}</tbody></table></div>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includePrice} onChange={(event) => setIncludePrice(event.target.checked)} className="size-4 accent-primary" />Hiển thị giá trên bản in</label><Button onClick={() => window.open(`/${locale}/admin/exports/${invoice.id}/print?includePrice=${includePrice}`, "_blank", "noopener,noreferrer")}><Printer className="size-4" />Mở bản in A4</Button></div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
