"use client";

import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatVnd } from "@/lib/format";
import { useExport } from "../hooks/use-exports";
import { BrandLogo } from "@/components/brand-logo";

export function PrintExportPage({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const includePrice = searchParams.get("includePrice") === "true";
  const query = useExport(id);
  if (query.isLoading) return <div className="p-10 text-center">Đang tải phiếu xuất...</div>;
  if (!query.data) return <div className="p-10 text-center text-danger">Không thể tải phiếu xuất.</div>;
  const invoice = query.data;
  return <main className="print-page mx-auto my-6 max-w-[210mm] bg-white p-8 text-black shadow-xl print:m-0 print:max-w-none print:shadow-none">
    <div className="mb-5 flex justify-end print:hidden"><Button onClick={() => window.print()}><Printer className="size-4" />In / Lưu PDF</Button></div>
    <header className="text-center"><div className="flex items-center justify-center gap-3"><BrandLogo size={56} /><p className="text-sm font-semibold uppercase tracking-[.18em]">HVG</p></div><h1 className="mt-2 text-3xl font-bold">{includePrice ? "HÓA ĐƠN BÁN HÀNG" : "PHIẾU XUẤT HÀNG"}</h1><p className="mt-2 font-mono">{invoice.invoiceCode}</p></header>
    <section className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 text-sm"><p><strong>Ngày:</strong> {formatDateTime(invoice.completedAt ?? invoice.createdAt)}</p><p><strong>Hình thức:</strong> {invoice.exportType === "DELIVERY" ? "Giao hàng" : "Bán tại nhà"}</p><p><strong>Khách hàng:</strong> {invoice.customerName || "Khách lẻ"}</p><p><strong>Điện thoại:</strong> {invoice.customerPhone || "—"}</p>{invoice.deliveryAddress && <p className="col-span-2"><strong>Địa chỉ:</strong> {invoice.deliveryAddress}</p>}</section>
    <table className="mt-8 w-full border-collapse text-sm"><thead><tr className="border-y-2 border-black"><th className="px-2 py-3 text-left">STT</th><th className="px-2 py-3 text-left">Sản phẩm</th><th className="px-2 py-3 text-center">Đơn vị</th><th className="px-2 py-3 text-right">Số lượng</th>{includePrice && <><th className="px-2 py-3 text-right">Đơn giá</th><th className="px-2 py-3 text-right">Thành tiền</th></>}</tr></thead><tbody>{invoice.items.map((item, index) => { const price = item.unitPrice ?? item.product.productPrice; return <tr key={item.id} className="border-b border-black/30"><td className="px-2 py-3">{index + 1}</td><td className="px-2 py-3"><strong>{item.product.productName}</strong><div className="font-mono text-xs">{item.product.productCode}</div>{item.lineNote && <div className="text-xs italic">{item.lineNote}</div>}</td><td className="px-2 py-3 text-center">{item.product.productUnit}</td><td className="px-2 py-3 text-right">{item.exportQuantity}</td>{includePrice && <><td className="px-2 py-3 text-right">{formatVnd(price)}</td><td className="px-2 py-3 text-right">{formatVnd(price * item.exportQuantity)}</td></>}</tr>; })}</tbody>{includePrice && <tfoot>{invoice.shippingFee > 0 && <><tr className="border-t border-black/30"><td colSpan={5} className="px-2 py-2 text-right">Tiền hàng</td><td className="px-2 py-2 text-right font-medium">{formatVnd(invoice.totalAmount - invoice.shippingFee)}</td></tr><tr className="border-b border-black/30"><td colSpan={5} className="px-2 py-2 text-right">Phí giao hàng (ship)</td><td className="px-2 py-2 text-right font-medium">{formatVnd(invoice.shippingFee)}</td></tr></>}<tr className="border-t-2 border-black"><td colSpan={5} className="px-2 py-4 text-right font-bold">TỔNG CỘNG</td><td className="px-2 py-4 text-right text-lg font-bold">{formatVnd(invoice.totalAmount)}</td></tr></tfoot>}</table>
    {invoice.exportNote && <p className="mt-6 text-sm"><strong>Ghi chú:</strong> {invoice.exportNote}</p>}
    {includePrice && <section className="mt-4 text-right text-sm">{invoice.paidAmount != null ? <><p>Đã trả: {formatVnd(invoice.paidAmount)}</p><p className="font-bold">Còn nợ: {formatVnd(invoice.outstandingAmount ?? 0)}</p></> : <p>{invoice.exportStatus === "CANCELLED" ? "PHIẾU ĐÃ HỦY" : invoice.exportStatus === "EDITING" ? "PHIẾU NHÁP" : "Thanh toán: Chưa xác nhận"}</p>}</section>}
    <div className="mt-14 grid grid-cols-2 text-center text-sm"><div><strong>Người nhận hàng</strong><p className="mt-20">(Ký và ghi rõ họ tên)</p></div><div><strong>Người lập phiếu</strong><p className="mt-20">(Ký và ghi rõ họ tên)</p></div></div>
  </main>;
}
