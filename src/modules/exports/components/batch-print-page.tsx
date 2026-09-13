"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { exportsService } from "../services/exports.service";
import { SingleInvoicePrintView, STORE_PHONE_1, STORE_PHONE_2 } from "./print-export-page";
import { BrandLogo } from "@/components/brand-logo";
import { formatDateTime, formatVnd } from "@/lib/format";
import type { ExportInvoice } from "../types/export";

function MergedInvoicesPrintView({
  invoices,
  includePrice,
}: {
  invoices: ExportInvoice[];
  includePrice: boolean;
}) {
  const totalQuantity = invoices.reduce(
    (sum, inv) => sum + inv.items.reduce((s, it) => s + it.exportQuantity, 0),
    0
  );
  const totalShippingFee = invoices.reduce((sum, inv) => sum + (inv.shippingFee || 0), 0);
  const totalGoodsAmount = invoices.reduce(
    (sum, inv) => sum + (inv.totalAmount - (inv.shippingFee || 0)),
    0
  );
  const grandTotalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaidAmount = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalOutstandingAmount = invoices.reduce(
    (sum, inv) => sum + (inv.outstandingAmount || 0),
    0
  );

  // Kiểm tra nếu tất cả hóa đơn cùng một khách hàng
  const firstCustomerName = invoices[0]?.customerName?.trim();
  const isSameCustomer = invoices.every(
    (inv) => (inv.customerName?.trim() || "") === (firstCustomerName || "")
  );
  const commonCustomer = isSameCustomer && invoices[0] ? invoices[0] : null;

  return (
    <div className="invoice-sheet bg-white text-black font-sans text-xs">
      {/* 1. HEADER DÙNG CHUNG 1 LẦN DUY NHẤT */}
      <header className="text-center">
        <div className="flex items-center justify-center gap-2">
          <BrandLogo size={40} />
          <p className="text-xs font-semibold uppercase tracking-[.18em]">HVG</p>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-gray-700">
          Hotline / SĐT: <strong>{STORE_PHONE_1}</strong> – <strong>{STORE_PHONE_2}</strong>
        </p>
        <h1 className="mt-1.5 text-xl font-bold uppercase tracking-wide">
          {includePrice ? "BẢNG KÊ HÓA ĐƠN BÁN HÀNG" : "BẢNG KÊ XUẤT HÀNG"}
        </h1>
        <p className="mt-0.5 text-xs text-gray-600 font-medium">
          (Bảng kê tổng hợp {invoices.length} hóa đơn)
        </p>
      </header>

      {/* Thông tin khách hàng dùng chung */}
      <section className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-y border-dashed border-gray-300 py-2">
        {commonCustomer ? (
          <>
            <p>
              <strong className="text-gray-700">Khách hàng:</strong>{" "}
              {commonCustomer.customerName || "Khách lẻ"}
            </p>
            <p>
              <strong className="text-gray-700">Điện thoại:</strong>{" "}
              {commonCustomer.customerPhone || "—"}
            </p>
            {commonCustomer.deliveryAddress && (
              <p className="col-span-2">
                <strong className="text-gray-700">Địa chỉ:</strong>{" "}
                {commonCustomer.deliveryAddress}
              </p>
            )}
          </>
        ) : (
          <p className="col-span-2 text-gray-700">
            <strong>Khách hàng:</strong> Nhiều khách hàng ({invoices.length} hóa đơn chi tiết bên dưới)
          </p>
        )}
      </section>

      {/* 2. NỘI DUNG TỪNG HÓA ĐƠN NỐI TIẾP NHAU */}
      <div className="mt-3 space-y-4">
        {invoices.map((inv, index) => {
          const invTotalQty = inv.items.reduce((s, it) => s + it.exportQuantity, 0);
          return (
            <div key={inv.id} className="invoice-sub-block border border-gray-200 rounded p-2.5">
              {/* Tiêu đề đơn */}
              <div className="flex flex-wrap items-center justify-between gap-1 border-b pb-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-black px-1.5 py-0.5 text-[10px] font-bold text-white">
                    #{index + 1}
                  </span>
                  <strong className="font-mono text-xs">{inv.invoiceCode}</strong>
                  {!isSameCustomer && inv.customerName && (
                    <span className="text-xs text-gray-600 font-medium">
                      ({inv.customerName})
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-600">
                  {formatDateTime(inv.completedAt ?? inv.createdAt)} ·{" "}
                  <span className="font-medium">
                    {inv.exportType === "DELIVERY" ? "Giao hàng" : "Bán tại nhà"}
                  </span>
                </div>
              </div>

              {/* Bảng sản phẩm của đơn */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/20 text-gray-600">
                    <th className="px-1.5 py-1 text-left w-7">STT</th>
                    <th className="px-1.5 py-1 text-left">Sản phẩm</th>
                    <th className="px-1.5 py-1 text-center w-12">ĐVT</th>
                    <th className="px-1.5 py-1 text-right w-12">SL</th>
                    {includePrice && (
                      <>
                        <th className="px-1.5 py-1 text-right w-20">Đơn giá</th>
                        <th className="px-1.5 py-1 text-right w-24">Thành tiền</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {inv.items.map((item, itemIdx) => {
                    const origPrice = item.originalPrice ?? item.product.productPrice;
                    const sellingPrice = item.unitPrice ?? item.product.productPrice;
                    const hasDiscount = origPrice > sellingPrice;
                    return (
                      <tr key={item.id} className="border-b border-black/10">
                        <td className="px-1.5 py-1 align-top text-gray-500">{itemIdx + 1}</td>
                        <td className="px-1.5 py-1 align-top">
                          <span className="font-medium text-black">{item.product.productName}</span>
                          {includePrice && hasDiscount && (
                            <span className="ml-1.5 text-[10px] text-emerald-700 font-medium">
                              (Giảm {formatVnd(origPrice - sellingPrice)}/sp)
                            </span>
                          )}
                          {item.lineNote && (
                            <span className="ml-1.5 text-[10px] italic text-gray-500">
                              ({item.lineNote})
                            </span>
                          )}
                        </td>
                        <td className="px-1.5 py-1 text-center align-top">
                          {item.product.productUnit}
                        </td>
                        <td className="px-1.5 py-1 text-right font-medium align-top">
                          {item.exportQuantity}
                        </td>
                        {includePrice && (
                          <>
                            <td className="px-1.5 py-1 text-right align-top">
                              {formatVnd(sellingPrice)}
                            </td>
                            <td className="px-1.5 py-1 text-right font-medium align-top">
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
                    {inv.shippingFee > 0 && (
                      <tr className="border-t border-black/10 text-gray-600">
                        <td colSpan={5} className="px-1.5 py-0.5 text-right text-[11px]">
                          Phí giao hàng ({invTotalQty} sp):
                        </td>
                        <td className="px-1.5 py-0.5 text-right font-medium text-[11px]">
                          +{formatVnd(inv.shippingFee)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-black/20 text-gray-800">
                      <td colSpan={5} className="px-1.5 py-1 text-right font-semibold text-xs">
                        Tạm tính đơn {inv.invoiceCode}:
                      </td>
                      <td className="px-1.5 py-1 text-right font-bold text-xs">
                        {formatVnd(inv.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {inv.exportNote && (
                <p className="mt-1 text-[11px] text-gray-600 italic">
                  <strong>Ghi chú:</strong> {inv.exportNote}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. FOOTER TỔNG HỢP DÙNG CHUNG 1 LẦN Ở CUỐI */}
      <div className="mt-4 border-t-2 border-black pt-2 text-xs break-inside-avoid">
        <div className="flex justify-between items-center py-1">
          <span className="font-semibold text-gray-700">Tổng số lượng hàng:</span>
          <span>
            <strong>{totalQuantity}</strong> sản phẩm ({invoices.length} hóa đơn)
          </span>
        </div>
        {includePrice && (
          <>
            <div className="flex justify-between items-center py-0.5 text-gray-600">
              <span>Tổng tiền hàng:</span>
              <span>{formatVnd(totalGoodsAmount)}</span>
            </div>
            {totalShippingFee > 0 && (
              <div className="flex justify-between items-center py-0.5 text-gray-600">
                <span>Tổng phí giao hàng:</span>
                <span>{formatVnd(totalShippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-black/30 py-1.5 text-sm font-bold">
              <span>TỔNG CỘNG TẤT CẢ:</span>
              <span className="text-base font-bold">{formatVnd(grandTotalAmount)}</span>
            </div>
            <div className="flex justify-end gap-6 border-t border-dashed border-gray-300 py-1 text-xs">
              <span>
                Đã thanh toán: <strong>{formatVnd(totalPaidAmount)}</strong>
              </span>
              <span>
                Còn nợ:{" "}
                <strong className={totalOutstandingAmount > 0 ? "text-danger" : ""}>
                  {formatVnd(totalOutstandingAmount)}
                </strong>
              </span>
            </div>
          </>
        )}
      </div>

      {/* KHỐI CHỮ KÝ CHUNG 1 LẦN Ở CUỐI */}
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

export function BatchPrintPage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const [includePrice, setIncludePrice] = useState(
    searchParams.get("includePrice") === "true"
  );

  const invoiceIds = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const results = useQueries({
    queries: invoiceIds.map((id) => ({
      queryKey: ["exports", id],
      queryFn: () => exportsService.detail(id),
      enabled: Boolean(id),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const invoices = results
    .map((r) => r.data)
    .filter((inv): inv is NonNullable<typeof inv> => Boolean(inv));

  if (!invoiceIds.length) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Không có mã hóa đơn nào được chọn để in.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm">
        Đang tải dữ liệu {invoiceIds.length} hóa đơn...
      </div>
    );
  }

  if (!invoices.length) {
    return (
      <div className="p-10 text-center text-sm text-danger">
        Không thể tải thông tin các hóa đơn đã chọn.
      </div>
    );
  }

  // Nếu chỉ có 1 hóa đơn được chọn: quay về giao diện in đơn lẻ cũ
  if (invoices.length === 1) {
    const singleInvoice = invoices[0];
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

        <SingleInvoicePrintView invoice={singleInvoice} includePrice={includePrice} />
      </main>
    );
  }

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
          <span>Hiển thị giá tiền ({includePrice ? "Có giá" : "Không giá"})</span>
        </label>
        <Button onClick={() => window.print()} size="sm" className="gap-2">
          <Printer className="size-4" /> In ({invoices.length} đơn) / Lưu PDF
        </Button>
      </div>

      <MergedInvoicesPrintView invoices={invoices} includePrice={includePrice} />
    </main>
  );
}
