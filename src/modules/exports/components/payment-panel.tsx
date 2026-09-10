"use client";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { clientId } from "@/lib/client-id";
import { formatDateTime, formatVnd } from "@/lib/format";
import { CustomerPicker } from "@/modules/customers/customer-picker";
import type { Customer } from "@/modules/customers/customers";
import type { ExportInvoice } from "../types/export";
export const paymentLabels = { UNKNOWN: "Chưa xác nhận", PAID: "Đã trả đủ", PARTIAL: "Trả một phần", UNPAID: "Chưa trả", DRAFT: "Phiếu nháp", CANCELLED: "Đã hủy" };
export function PaymentSummary({ invoice }: { invoice: ExportInvoice }) {
  return <div className="text-sm"><span className={invoice.outstandingAmount ? "font-semibold text-danger" : "text-muted-foreground"}>{paymentLabels[invoice.paymentStatus] ?? "Chưa xác nhận"}</span>{invoice.outstandingAmount != null && <p className="whitespace-nowrap text-xs">Còn nợ: {formatVnd(invoice.outstandingAmount)}</p>}</div>;
}
export function PaymentPanel({ invoice }: { invoice: ExportInvoice }) {
  const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [pending, setPending] = useState(false);
  const [reverseId, setReverseId] = useState<string | null>(null); const [reason, setReason] = useState("");
  const [reconciling, setReconciling] = useState(false); const [customer, setCustomer] = useState<Customer | null>(null);
  const attempt = useRef<{ key: string; fingerprint: string } | null>(null); const busy = useRef(false);
  const client = useQueryClient();
  const run = async (path: string, input: unknown) => {
    if (busy.current) return; busy.current = true; setPending(true);
    try { const updated = await apiClient.post<ExportInvoice>(`/api/backend/exports/${invoice.id}/${path}`, input); client.setQueryData(["exports", invoice.id], updated); await Promise.all([client.invalidateQueries({ queryKey: ["exports"] }), client.invalidateQueries({ queryKey: ["customers"] })]); setAmount(""); setNote(""); setReverseId(null); setReason(""); setReconciling(false); attempt.current = null; toast.success("Đã cập nhật thanh toán"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Không thể cập nhật thanh toán"); }
    finally { busy.current = false; setPending(false); }
  };
  return <section className="mt-5 space-y-3 rounded-xl border p-4">
    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Thanh toán & công nợ</h3><PaymentSummary invoice={invoice} /></div>
    {invoice.paidAmount != null && <p className="text-sm">Tổng: {formatVnd(invoice.totalAmount)} · Đã trả: <strong>{formatVnd(invoice.paidAmount)}</strong></p>}
    {invoice.reconciliationNote && <p className="text-xs text-muted-foreground">Đối soát: {invoice.reconciliationNote}</p>}
    {invoice.paymentStatus === "UNKNOWN" && <><p className="text-sm text-muted-foreground">Phiếu cũ chưa có dữ liệu thu tiền. Không mặc định là đang nợ hoặc đã trả đủ.</p><Button size="sm" variant="outline" onClick={() => setReconciling(!reconciling)}>Đối soát phiếu cũ</Button></>}
    {reconciling && <form className="space-y-3 rounded-lg bg-secondary/40 p-3" onSubmit={e => { e.preventDefault(); void run("reconcile", { paidAmount: Number(amount), note: note.trim(), ...(customer ? { customerId: customer.id } : {}) }); }}>
      <CustomerPicker selected={customer} onSelect={setCustomer} disabled={pending} />
      <label className="block text-sm">Tổng tiền khách đã trả trước đây (đ)<Input required type="number" min={0} max={invoice.totalAmount} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label className="block text-sm">Ghi chú đối soát<Textarea required maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
      <p className="text-xs text-muted-foreground">Giữ nguyên thông tin người nhận trên phiếu cũ; hồ sơ chọn ở đây dùng để tổng hợp công nợ.</p>
      <Button disabled={pending || !note.trim() || amount === "" || (Number(amount) < invoice.totalAmount && !customer && !invoice.customerId)}>Xác nhận số dư ban đầu</Button>
    </form>}
    {invoice.exportStatus === "COMPLETED" && (invoice.outstandingAmount ?? 0) > 0 && <form className="space-y-3 rounded-lg bg-secondary/40 p-3" onSubmit={e => { e.preventDefault(); const input = { amount: Number(amount), note: note.trim() }; const fingerprint = JSON.stringify(input); if (attempt.current?.fingerprint !== fingerprint) attempt.current = { key: clientId(), fingerprint }; void run("payments", { ...input, idempotencyKey: attempt.current.key }); }}>
      <label className="block text-sm font-medium">Thu thêm theo hóa đơn (đ)<Input required type="number" min="0.01" max={invoice.outstandingAmount!} step="0.01" value={amount} disabled={pending} onChange={e => setAmount(e.target.value)} /></label>
      <label className="block text-sm">Ghi chú thu tiền<Input maxLength={500} value={note} disabled={pending} onChange={e => setNote(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2"><Button disabled={pending || !amount}>{pending ? "Đang ghi nhận…" : "Ghi nhận thu tiền"}</Button><Button type="button" variant="outline" disabled={pending} onClick={() => setAmount(String(invoice.outstandingAmount))}>Điền số còn nợ</Button></div>
    </form>}
    {!!invoice.payments?.length && <div className="space-y-2"><h4 className="text-sm font-semibold">Lịch sử thu tiền</h4>{invoice.payments.map(p => <div key={p.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong className={p.reversedAt ? "text-muted-foreground line-through" : "text-primary"}>{formatVnd(p.amount)}</strong><span className="text-xs text-muted-foreground">{formatDateTime(p.paidAt)}</span></div>{p.note && <p className="mt-1 whitespace-pre-wrap break-words">{p.note}</p>}{p.reversedAt ? <p className="mt-1 text-xs text-danger">Đã hoàn/đảo {formatDateTime(p.reversedAt)} · {p.reversalReason}</p> : <Button size="sm" variant="ghost" className="mt-1 text-danger" disabled={pending} onClick={() => { setReverseId(p.id); setReason(""); }}>Hoàn/đảo khoản thu</Button>}
      {reverseId === p.id && <form className="mt-2 space-y-2" onSubmit={e => { e.preventDefault(); void run(`payments/${p.id}/reverse`, { reason: reason.trim() }); }}><p className="text-xs text-danger">Thao tác này ghi sổ hoàn/đảo tiền, không tự chuyển tiền cho khách. Số còn nợ sẽ tăng lại.</p><Input aria-label="Lý do hoàn hoặc đảo" required maxLength={500} placeholder="Lý do hoàn/đảo khoản thu" value={reason} onChange={e => setReason(e.target.value)} /><Button disabled={pending || !reason.trim()}>Xác nhận hoàn/đảo</Button><Button type="button" variant="ghost" disabled={pending} onClick={() => setReverseId(null)}>Đóng</Button></form>}
    </div>)}</div>}
  </section>;
}
