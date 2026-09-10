"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X } from "lucide-react";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatVnd } from "@/lib/format";
import type { ExportInvoice } from "../types/export";
import { useExport } from "../hooks/use-exports";
import { PaymentPanel, PaymentSummary } from "./payment-panel";

export function ExportDetailDialog({ invoice: initial, open, onOpenChange }: { invoice: ExportInvoice | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [includePrice, setIncludePrice] = useState(false);
  const detail = useExport(open ? initial?.id ?? "" : "");
  const invoice = detail.data ?? initial;
  const locale = useLocale();
  if (!invoice) return null;
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-xs" /><Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] w-full rounded-t-3xl border-t bg-white p-4 pb-8 shadow-2xl overflow-y-auto sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[92vh] sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6 sm:border">
    <div className="flex justify-between border-b pb-3"><div><Dialog.Title className="text-lg sm:text-xl font-bold text-primary">{invoice.invoiceCode}</Dialog.Title><Dialog.Description className="text-xs sm:text-sm text-muted-foreground">{formatDateTime(invoice.completedAt ?? invoice.createdAt)} · {invoice.exportType === "DELIVERY" ? "Giao hàng" : "Bán tại nhà"}</Dialog.Description></div><Dialog.Close className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></Dialog.Close></div>
    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Khách hàng:</span> {invoice.customerName || "—"}</p><p><span className="text-muted-foreground">Điện thoại:</span> {invoice.customerPhone || "—"}</p>{invoice.deliveryAddress && <p className="sm:col-span-2"><span className="text-muted-foreground">Địa chỉ:</span> {invoice.deliveryAddress}</p>}</div>
    <div className="mt-4 overflow-hidden rounded-xl border"><table className="w-full text-sm"><thead className="bg-secondary text-left"><tr><th className="p-3">Sản phẩm</th><th className="p-3 text-right">Số lượng</th><th className="p-3 text-right">Thành tiền</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.id} className="border-t"><td className="p-3"><strong>{item.product.productName}</strong><p className="text-xs text-muted-foreground">{item.product.productCode}</p></td><td className="p-3 text-right">{item.exportQuantity} {item.product.productUnit}</td><td className="p-3 text-right">{formatVnd((item.unitPrice ?? item.product.productPrice) * item.exportQuantity)}</td></tr>)}</tbody></table></div>
    {/* Khối tóm tắt thanh toán & liên kết tới Quản lý công nợ khách hàng */}
    <div className="mt-4 rounded-xl border bg-secondary/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Thanh toán & Công nợ</h4>
          <p className="text-xs text-muted-foreground">
            Công nợ được tổng hợp và quản lý tập trung theo hồ sơ Khách hàng.
          </p>
        </div>
        <PaymentSummary invoice={invoice} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <p>
          <span className="text-muted-foreground">Tổng tiền:</span>{" "}
          <strong>{formatVnd(invoice.totalAmount)}</strong>
          {invoice.shippingFee > 0 && (
            <span className="block text-xs text-muted-foreground">
              (Tiền hàng: {formatVnd(invoice.totalAmount - invoice.shippingFee)} + Ship: {formatVnd(invoice.shippingFee)})
            </span>
          )}
        </p>
        <p>
          <span className="text-muted-foreground">Đã trả lúc xuất:</span>{" "}
          <strong className="text-emerald-600">{formatVnd(invoice.paidAmount ?? 0)}</strong>
        </p>
        <p>
          <span className="text-muted-foreground">Ghi nợ đơn này:</span>{" "}
          <strong className={invoice.outstandingAmount ? "text-danger" : "text-muted-foreground"}>
            {formatVnd(invoice.outstandingAmount ?? 0)}
          </strong>
        </p>
      </div>

      {invoice.customerId && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-3 border">
          <span className="text-xs text-muted-foreground">
            Khách hàng: <strong>{invoice.customerName}</strong>
          </span>
          <a
            href={`/${locale}/admin/customers/${invoice.customerId}`}
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
          >
            Mở sổ công nợ khách hàng để thu nợ →
          </a>
        </div>
      )}
    </div>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includePrice}
          onChange={(event) => setIncludePrice(event.target.checked)}
          className="size-4 accent-primary"
        />
        Hiển thị giá trên bản in
      </label>
      <Button
        onClick={() =>
          window.open(
            `/${locale}/admin/exports/${invoice.id}/print?includePrice=${includePrice}`,
            "_blank",
            "noopener,noreferrer",
          )
        }
      >
        <Printer className="size-4" />
        Mở bản in A4
      </Button>
    </div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
