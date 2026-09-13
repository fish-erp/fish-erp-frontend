"use client";
import { useState } from "react";
import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatVnd } from "@/lib/format";
import { useExport } from "../hooks/use-exports";
import { BrandLogo } from "@/components/brand-logo";
import type { ExportInvoice } from "../types/export";

// =========================================================================
// THÔNG TIN CỬA HÀNG TRÊN HÓA ĐƠN
// =========================================================================
export const STORE_PHONE_1 = "0345.172.752";
export const STORE_PHONE_2 = "0948.390.226";

export function SingleInvoicePrintView({
  invoice,
  includePrice,
}: {
  invoice: ExportInvoice;
  includePrice: boolean;
}) {
  const totalQuantity = invoice.items.reduce((sum, item) => sum + item.exportQuantity, 0);
  const shipPerUnit =
    invoice.shippingFee > 0 && totalQuantity > 0
      ? Math.round(invoice.shippingFee / totalQuantity)
      : null;

  return (
    <div className="invoice-sheet bg-white text-black font-sans text-xs">
      {/* Header */}
      <header className="text-center">
        <div className="flex items-center justify-center gap-2">
          <BrandLogo size={40} />
          <p className="text-xs font-semibold uppercase tracking-[.18em]">HVG</p>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-gray-700">
          Hotline / SĐT: <strong>{STORE_PHONE_1}</strong> – <strong>{STORE_PHONE_2}</strong>
        </p>
        <h1 className="mt-1.5 text-xl font-bold uppercase tracking-wide">
          {includePrice ? "HÓA ĐƠN BÁN HÀNG" : "PHIẾU XUẤT HÀNG"}
        </h1>
        <p className="mt-0.5 font-mono text-xs font-semibold text-gray-800">{invoice.invoiceCode}</p>
      </header>

      {/* Thông tin khách hàng & hóa đơn */}
      <section className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-y border-dashed border-gray-300 py-2">
        <p>
          <strong className="text-gray-700">Ngày:</strong> {formatDateTime(invoice.completedAt ?? invoice.createdAt)}
        </p>
        <p>
          <strong className="text-gray-700">Hình thức:</strong>{" "}
          {invoice.exportType === "DELIVERY" ? "Giao hàng" : "Bán tại nhà"}
        </p>
        <p>
          <strong className="text-gray-700">Khách hàng:</strong> {invoice.customerName || "Khách lẻ"}
        </p>
        <p>
          <strong className="text-gray-700">Điện thoại:</strong> {invoice.customerPhone || "—"}
        </p>
        {invoice.deliveryAddress && (
          <p className="col-span-2">
            <strong className="text-gray-700">Địa chỉ:</strong> {invoice.deliveryAddress}
          </p>
        )}
      </section>

      {/* Bảng sản phẩm */}
      <table className="mt-3 w-full border-collapse text-xs">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="px-1.5 py-1.5 text-left w-7">STT</th>
            <th className="px-1.5 py-1.5 text-left">Sản phẩm</th>
            <th className="px-1.5 py-1.5 text-center w-12">ĐVT</th>
            <th className="px-1.5 py-1.5 text-right w-12">SL</th>
            {includePrice && (
              <>
                <th className="px-1.5 py-1.5 text-right w-20">Đơn giá</th>
                <th className="px-1.5 py-1.5 text-right w-24">Thành tiền</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => {
            const origPrice = item.originalPrice ?? item.product.productPrice;
            const sellingPrice = item.unitPrice ?? item.product.productPrice;
            const hasDiscount = origPrice > sellingPrice;
            return (
              <tr key={item.id} className="border-b border-black/20">
                <td className="px-1.5 py-1.5 align-top">{index + 1}</td>
                <td className="px-1.5 py-1.5 align-top">
                  <div className="font-semibold text-black">{item.product.productName}</div>
                  <div className="font-mono text-[10px] text-gray-500">{item.product.productCode}</div>
                  {includePrice && hasDiscount && (
                    <div className="text-[10px] text-emerald-700 font-medium">
                      Gốc: {formatVnd(origPrice)} (Giảm {formatVnd(origPrice - sellingPrice)}/sp)
                    </div>
                  )}
                  {item.lineNote && <div className="text-[10px] italic text-gray-600">{item.lineNote}</div>}
                </td>
                <td className="px-1.5 py-1.5 text-center align-top">{item.product.productUnit}</td>
                <td className="px-1.5 py-1.5 text-right font-medium align-top">{item.exportQuantity}</td>
                {includePrice && (
                  <>
                    <td className="px-1.5 py-1.5 text-right align-top">{formatVnd(sellingPrice)}</td>
                    <td className="px-1.5 py-1.5 text-right font-medium align-top">
                      {formatVnd(sellingPrice * item.exportQuantity)}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
        {includePrice && (
          <tfoot>
            {invoice.shippingFee > 0 && (
              <>
                <tr className="border-t border-black/20">
                  <td colSpan={5} className="px-1.5 py-1 text-right text-gray-600">
                    Tiền hàng
                  </td>
                  <td className="px-1.5 py-1 text-right font-medium">
                    {formatVnd(invoice.totalAmount - invoice.shippingFee)}
                  </td>
                </tr>
                <tr className="border-b border-black/20">
                  <td colSpan={5} className="px-1.5 py-1 text-right text-gray-600">
                    Phí giao hàng (ship)
                    {shipPerUnit !== null && (
                      <span className="text-[11px] text-gray-500 font-normal ml-1">
                        ({formatVnd(shipPerUnit)} × {totalQuantity} sp)
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-1 text-right font-medium">
                    {formatVnd(invoice.shippingFee)}
                  </td>
                </tr>
              </>
            )}
            <tr className="border-t-2 border-black">
              <td colSpan={5} className="px-1.5 py-1.5 text-right font-bold text-sm">
                TỔNG CỘNG
              </td>
              <td className="px-1.5 py-1.5 text-right text-sm font-bold">
                {formatVnd(invoice.totalAmount)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      {invoice.exportNote && (
        <p className="mt-2.5 text-xs">
          <strong>Ghi chú:</strong> {invoice.exportNote}
        </p>
      )}

      {/* Thông tin thanh toán */}
      {includePrice && (
        <section className="mt-2 text-right text-xs">
          {invoice.paidAmount != null ? (
            <>
              <p>Đã trả: <strong>{formatVnd(invoice.paidAmount)}</strong></p>
              <p className="font-bold text-sm">Còn nợ: {formatVnd(invoice.outstandingAmount ?? 0)}</p>
            </>
          ) : (
            <p>
              {invoice.exportStatus === "CANCELLED"
                ? "PHIẾU ĐÃ HỦY"
                : invoice.exportStatus === "EDITING"
                ? "PHIẾU NHÁP"
                : "Thanh toán: Chưa xác nhận"}
            </p>
          )}
        </section>
      )}

      {/* Phần ký nhận */}
      <div className="mt-6 grid grid-cols-2 text-center text-xs break-inside-avoid">
        <div>
          <strong className="block font-semibold">Người nhận hàng</strong>
          <span className="text-[11px] text-gray-500">(Ký, ghi rõ họ tên)</span>
          <div className="h-14" />
        </div>
        <div>
          <strong className="block font-semibold">Người lập phiếu</strong>
          <span className="text-[11px] text-gray-500">(Ký, ghi rõ họ tên)</span>
          <div className="h-14" />
        </div>
      </div>
    </div>
  );
}

export function PrintExportPage({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [includePrice, setIncludePrice] = useState(
    searchParams.get("includePrice") === "true"
  );
  const query = useExport(id);

  if (query.isLoading) {
    return <div className="p-10 text-center text-sm">Đang tải phiếu xuất...</div>;
  }
  if (!query.data) {
    return <div className="p-10 text-center text-sm text-danger">Không thể tải phiếu xuất.</div>;
  }

  const invoice = query.data;

  return (
    <main className="print-page mx-auto my-6 max-w-[148mm] bg-white p-6 text-black shadow-xl rounded-sm print:m-0 print:p-0 print:max-w-none print:shadow-none print:rounded-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3 print:hidden">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer select-none bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md border transition">
          <input
            type="checkbox"
            checked={includePrice}
            onChange={(e) => setIncludePrice(e.target.checked)}
            className="size-4 rounded accent-primary cursor-pointer"
          />
          <span>Hiển thị giá tiền ({includePrice ? "Hóa đơn bán hàng" : "Phiếu xuất hàng"})</span>
        </label>
        <Button onClick={() => window.print()} size="sm" className="gap-2">
          <Printer className="size-4" /> In / Lưu PDF
        </Button>
      </div>

      <SingleInvoicePrintView invoice={invoice} includePrice={includePrice} />
    </main>
  );
}
