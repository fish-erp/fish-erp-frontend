"use client";
import { useState } from "react";
import { Page } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Link } from "@/i18n/navigation";
import { formatDateTime, formatVnd } from "@/lib/format";
import { ExportDetailDialog } from "@/modules/exports/components/export-detail-dialog";
import { PaymentSummary } from "@/modules/exports/components/payment-panel";
import type { ExportInvoice } from "@/modules/exports/types/export";
import { useCustomer } from "./customers";
export function CustomerDetailPage({ id }: { id: string }) {
  const [page, setPage] = useState(1); const [viewing, setViewing] = useState<ExportInvoice | null>(null); const query = useCustomer(id, page); const c = query.data;
  return <Page title={c?.name ?? "Chi tiết khách hàng"} description={c ? `${c.phoneNumber} · ${c.address || "Chưa có địa chỉ"}${c.archived ? " · Ngừng sử dụng" : ""}` : "Hồ sơ và lịch sử hóa đơn"} actions={<Link className="text-sm text-primary" href="/admin/customers">← Danh sách khách hàng</Link>}>
    <p className="text-sm text-muted-foreground">Mở từng hóa đơn để thu tiền, xem lịch sử hoặc hoàn/đảo khoản thu. Phiếu nháp và phiếu hủy không tính công nợ.</p>
    {query.isPending ? <p>Đang tải…</p> : query.isError ? <p role="alert" className="text-danger">Không tải được hồ sơ. <button onClick={() => void query.refetch()}>Thử lại</button></p> : !c?.invoices.length ? <p>Khách chưa có hóa đơn.</p> : <DataTable rows={c.invoices} rowKey={i => i.id} columns={[
      { key: "code", label: "Hóa đơn", render: i => <button className="font-mono font-semibold text-primary hover:underline" onClick={() => setViewing(i)}>{i.invoiceCode}</button> },
      { key: "date", label: "Ngày", render: i => formatDateTime(i.completedAt ?? i.createdAt) },
      { key: "total", label: "Tổng tiền", render: i => formatVnd(i.totalAmount) },
      { key: "payment", label: "Thanh toán", render: i => <PaymentSummary invoice={i} /> },
      { key: "open", label: "", render: i => <Button variant="outline" size="sm" onClick={() => setViewing(i)}>Chi tiết / Thu tiền</Button> },
    ]} />}
    <div className="flex justify-end gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</Button><span className="self-center text-sm">{page}/{c?.meta.totalPages ?? 1}</span><Button variant="outline" disabled={page >= (c?.meta.totalPages ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</Button></div>
    <ExportDetailDialog invoice={viewing} open={!!viewing} onOpenChange={v => { if (!v) setViewing(null); }} />
  </Page>;
}
