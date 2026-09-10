"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, DollarSign, History, Receipt, RotateCcw, ShoppingBag, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import { clientId } from "@/lib/client-id";
import { formatDateTime, formatMoneyPreview, formatVnd } from "@/lib/format";
import { ExportDetailDialog } from "@/modules/exports/components/export-detail-dialog";
import type { ExportInvoice } from "@/modules/exports/types/export";
import { customerService, useCustomer, type CustomerPayment } from "./customers";

export function CustomerDetailPage({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const PAYMENTS_PER_PAGE = 10;
  const [viewing, setViewing] = useState<ExportInvoice | null>(null);

  // Tab chuyển đổi: Thu nợ hoặc Nạp tiền trả trước
  const [actionType, setActionType] = useState<"DEBT" | "ADVANCE">("DEBT");

  // Thu tiền
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  // Đảo khoản thu
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState("");

  const queryClient = useQueryClient();
  const query = useCustomer(id, page);
  const customer = query.data;

  // Dữ liệu phân trang lịch sử thu tiền (10 dòng/trang)
  const allPayments = customer?.payments ?? [];
  const totalPaymentPages = Math.max(1, Math.ceil(allPayments.length / PAYMENTS_PER_PAGE));
  const currentPaymentPage = Math.min(paymentPage, totalPaymentPages);
  const currentPayments = allPayments.slice(
    (currentPaymentPage - 1) * PAYMENTS_PER_PAGE,
    currentPaymentPage * PAYMENTS_PER_PAGE,
  );

  // Tự động chọn tab Thu nợ nếu còn nợ, hoặc tab Nạp tiền nếu hết nợ
  useEffect(() => {
    if (customer && customer.outstandingAmount > 0) {
      setActionType("DEBT");
    } else if (customer && customer.outstandingAmount <= 0) {
      setActionType("ADVANCE");
    }
  }, [customer?.outstandingAmount]);

  // Ghi nhận thu tiền hoặc nạp tiền trả trước
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ lớn hơn 0");
      return;
    }

    setPending(true);
    try {
      const defaultNote = actionType === "DEBT" ? "Thu nợ khách hàng" : "Nạp tiền trả trước mua sau";
      await customerService.addPayment(id, {
        amount: numAmount,
        idempotencyKey: clientId(),
        note: note.trim() || defaultNote,
      });
      toast.success(actionType === "DEBT" ? "Đã ghi nhận thu nợ thành công!" : "Đã nạp tiền trả trước thành công!");
      setAmount("");
      setNote("");
      setPaymentPage(1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customers", id] }),
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể ghi nhận thanh toán");
    } finally {
      setPending(false);
    }
  };

  // Hoàn/đảo khoản thu nếu thu nhầm
  const handleReversePayment = async (paymentId: string) => {
    if (!reversalReason.trim()) {
      toast.error("Vui lòng nhập lý do hoàn/đảo khoản thu");
      return;
    }

    setPending(true);
    try {
      await customerService.reversePayment(id, paymentId, {
        reason: reversalReason.trim(),
      });
      toast.success("Đã hoàn/đảo khoản thu thành công");
      setReversingId(null);
      setReversalReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customers", id] }),
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể hoàn/đảo khoản thu");
    } finally {
      setPending(false);
    }
  };

  return (
    <Page
      title={customer?.name ?? "Chi tiết khách hàng"}
      description={
        customer
          ? `${customer.phoneNumber} · ${customer.address || "Chưa có địa chỉ"}${customer.archived ? " · Ngừng sử dụng" : ""}`
          : "Hồ sơ khách hàng và quản lý công nợ"
      }
      actions={
        <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href="/admin/customers">
          <ArrowLeft className="size-4" /> Danh sách khách hàng
        </Link>
      }
    >
      {query.isPending ? (
        <div className="h-48 rounded-2xl skeleton" />
      ) : query.isError ? (
        <div className="rounded-xl border border-danger/30 p-6 text-center text-danger">
          <p>Không tải được hồ sơ khách hàng.</p>
          <Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : !customer ? (
        <p className="text-muted-foreground">Khách hàng không tồn tại.</p>
      ) : (
        <div className="space-y-6">
          {/* Tổng quan công nợ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tổng mua hàng */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Tổng tiền mua</span>
                <ShoppingBag className="size-5 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {formatVnd(customer.totalPurchased ?? 0)}
              </p>
              <span className="text-xs text-muted-foreground">Đơn hoàn thành</span>
            </div>

            {/* Đã thanh toán */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Đã thanh toán</span>
                <CheckCircle2 className="size-5 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatVnd(customer.totalPaid ?? 0)}
              </p>
              <span className="text-xs text-muted-foreground">Các khoản thu hợp lệ</span>
            </div>

            {/* Tiền nợ hiện tại */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Tiền nợ</span>
                <DollarSign className={`size-5 ${customer.outstandingAmount > 0 ? "text-danger" : "text-muted-foreground"}`} />
              </div>
              <p
                className={`mt-2 text-2xl font-bold ${
                  customer.outstandingAmount > 0 ? "text-danger" : "text-muted-foreground font-semibold"
                }`}
              >
                {formatVnd(customer.outstandingAmount ?? 0)}
              </p>
              <span className="text-xs text-muted-foreground">
                {customer.outstandingAmount > 0 ? "Khách đang nợ tiền" : "Đã thanh toán đủ nợ"}
              </span>
            </div>

            {/* Tiền trả trước */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Tiền trả trước</span>
                <Wallet className={`size-5 ${(customer.advanceAmount ?? 0) > 0 ? "text-emerald-500" : "text-muted-foreground"}`} />
              </div>
              <p
                className={`mt-2 text-2xl font-bold ${
                  (customer.advanceAmount ?? 0) > 0 ? "text-emerald-600" : "text-muted-foreground font-semibold"
                }`}
              >
                {(customer.advanceAmount ?? 0) > 0 ? `+${formatVnd(customer.advanceAmount)}` : "0 ₫"}
              </p>
              <span className="text-xs text-muted-foreground">
                {(customer.advanceAmount ?? 0) > 0 ? "Số dư sẵn sàng mua hàng" : "Không có tiền trả trước"}
              </span>
            </div>
          </div>

          {/* Khối giao dịch: Thu nợ hoặc Nạp tiền trả trước */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex border-b pb-3 gap-4">
              <button
                type="button"
                onClick={() => {
                  setActionType("DEBT");
                  setAmount("");
                  setNote("");
                }}
                className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition ${
                  actionType === "DEBT"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <DollarSign className="size-4" />
                Thu tiền nợ
                {customer.outstandingAmount > 0 && (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                    Nợ {formatVnd(customer.outstandingAmount)}
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled={customer.outstandingAmount > 0}
                title={
                  customer.outstandingAmount > 0
                    ? "Khách còn nợ, vui lòng thanh toán hết nợ trước khi nạp trả trước"
                    : undefined
                }
                onClick={() => {
                  if (customer.outstandingAmount > 0) return;
                  setActionType("ADVANCE");
                  setAmount("");
                  setNote("");
                }}
                className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition ${
                  customer.outstandingAmount > 0
                    ? "cursor-not-allowed opacity-40 border-transparent text-muted-foreground"
                    : actionType === "ADVANCE"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wallet className="size-4" />
                Nạp tiền trả trước (mua sau)
                {customer.outstandingAmount > 0 ? (
                  <span className="text-xs text-muted-foreground">(Cần hết nợ)</span>
                ) : (customer.advanceAmount ?? 0) > 0 ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
                    Dư {formatVnd(customer.advanceAmount)}
                  </span>
                ) : null}
              </button>
            </div>

            {actionType === "DEBT" ? (
              customer.outstandingAmount <= 0 ? (
                <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-emerald-600">Khách hàng hiện đã thanh toán hết nợ!</p>
                  <p className="mt-1 text-xs">
                    Nếu khách hàng gửi tiền trước để mua hàng sau, vui lòng chọn tab{" "}
                    <button
                      type="button"
                      className="font-semibold text-primary underline"
                      onClick={() => setActionType("ADVANCE")}
                    >
                      Nạp tiền trả trước
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12" onSubmit={handleAddPayment}>
                  {/* Ô nhập số tiền thu nợ */}
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Số tiền thu nợ (đ) * (Tối đa: {formatVnd(customer.outstandingAmount)})
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={customer.outstandingAmount}
                      step="any"
                      required
                      disabled={pending || customer.archived}
                      placeholder={`Tối đa ${formatVnd(customer.outstandingAmount)}`}
                      value={amount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > customer.outstandingAmount) {
                          setAmount(String(customer.outstandingAmount));
                        } else {
                          setAmount(e.target.value);
                        }
                      }}
                    />
                    {Number(amount) > 0 && (
                      <p className="mt-1.5 text-xs font-semibold text-primary">
                        👉 {formatMoneyPreview(amount)}
                      </p>
                    )}
                  </div>

                  {/* Ô nhập ghi chú */}
                  <div className="sm:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Ghi chú thu nợ
                    </label>
                    <Input
                      disabled={pending || customer.archived}
                      placeholder="Ví dụ: Chuyển khoản, tiền mặt..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {/* Nút thao tác */}
                  <div className="flex items-end gap-2 sm:col-span-3">
                    <Button
                      type="submit"
                      disabled={pending || !amount || Number(amount) > customer.outstandingAmount || customer.archived}
                      className="flex-1"
                    >
                      {pending ? "Đang xử lý..." : "Xác nhận thu nợ"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending || customer.archived}
                      title="Điền toàn bộ số tiền còn nợ"
                      onClick={() => setAmount(String(customer.outstandingAmount))}
                    >
                      Trả hết nợ
                    </Button>
                  </div>
                </form>
              )
            ) : (
              <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12" onSubmit={handleAddPayment}>
                {/* Ô nhập tiền nạp trước */}
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Số tiền nạp trước (đ) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    required
                    disabled={pending || customer.archived}
                    placeholder="Ví dụ: 5000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {Number(amount) > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-xs font-semibold text-emerald-600">
                        👉 {formatMoneyPreview(amount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        💡 Số tiền này sẽ được cộng vào Tiền trả trước và tự động trừ dần khi mua hàng.
                      </p>
                    </div>
                  )}
                </div>

                {/* Ô nhập ghi chú */}
                <div className="sm:col-span-5">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Ghi chú nạp tiền
                  </label>
                  <Input
                    disabled={pending || customer.archived}
                    placeholder="Ví dụ: Đặt cọc mua hàng, gửi tiền trước..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {/* Nút thao tác */}
                <div className="flex items-end gap-2 sm:col-span-3">
                  <Button
                    type="submit"
                    disabled={pending || !amount || customer.archived}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {pending ? "Đang xử lý..." : "Xác nhận nạp tiền"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Lịch sử thu tiền */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <History className="size-5 text-primary" />
                Lịch sử thu tiền ({allPayments.length})
              </h3>
              {totalPaymentPages > 1 && (
                <span className="text-xs text-muted-foreground">
                  Trang {currentPaymentPage} / {totalPaymentPages}
                </span>
              )}
            </div>

            {!allPayments.length ? (
              <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Chưa có lịch sử thu tiền nào cho khách hàng này.
              </p>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {currentPayments.map((payment: CustomerPayment) => (
                  <div
                    key={payment.id}
                    className={`rounded-xl border p-4 transition ${
                      payment.reversedAt ? "bg-muted/40 opacity-75" : "bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span
                          className={`text-base font-bold ${
                            payment.reversedAt ? "text-muted-foreground line-through" : "text-emerald-600"
                          }`}
                        >
                          {formatVnd(payment.amount)}
                        </span>
                        <span className="ml-3 text-xs text-muted-foreground">
                          {formatDateTime(payment.paidAt)}
                        </span>
                      </div>

                      {/* Trạng thái và nút hoàn/đảo */}
                      <div>
                        {payment.reversedAt ? (
                          <span className="rounded-md bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                            Đã hoàn/đảo ({payment.reversalReason || "Không có lý do"})
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-danger hover:bg-danger/10"
                            disabled={pending}
                            onClick={() => {
                              setReversingId(payment.id);
                              setReversalReason("");
                            }}
                          >
                            <RotateCcw className="mr-1 size-3.5" /> Hoàn/đảo khoản thu
                          </Button>
                        )}
                      </div>
                    </div>

                    {payment.note && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <strong>Ghi chú:</strong> {payment.note}
                      </p>
                    )}

                    {/* Form xác nhận lý do hoàn/đảo */}
                    {reversingId === payment.id && (
                      <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 p-3">
                        <p className="text-xs font-medium text-danger">
                          Thao tác này sẽ hoàn tác khoản thu và tăng lại số nợ của khách:
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Input
                            className="text-xs"
                            placeholder="Nhập lý do hoàn/đảo (bắt buộc)..."
                            value={reversalReason}
                            onChange={(e) => setReversalReason(e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-danger text-danger hover:bg-danger/10"
                            disabled={pending || !reversalReason.trim()}
                            onClick={() => handleReversePayment(payment.id)}
                          >
                            Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => setReversingId(null)}
                          >
                            Đóng
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Phân trang lịch sử thu tiền (10 lịch sử / trang) */}
              {totalPaymentPages > 1 && (
                <div className="mt-4 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Hiển thị {(currentPaymentPage - 1) * PAYMENTS_PER_PAGE + 1} –{" "}
                    {Math.min(currentPaymentPage * PAYMENTS_PER_PAGE, allPayments.length)} trong tổng số{" "}
                    {allPayments.length} lần thu
                  </p>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPaymentPage <= 1}
                      onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                    >
                      Trang trước
                    </Button>
                    <span className="px-1 text-xs font-medium text-muted-foreground">
                      Trang {currentPaymentPage} / {totalPaymentPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPaymentPage >= totalPaymentPages}
                      onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
                    >
                      Trang sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>

          {/* Danh sách đơn hàng */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Receipt className="size-5 text-primary" />
              Lịch sử mua hàng ({customer.meta?.total ?? customer.invoices?.length ?? 0} đơn hàng)
            </h3>

            {!customer.invoices?.length ? (
              <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Khách hàng chưa có hóa đơn xuất hàng nào.
              </p>
            ) : (
              <div className="mt-4">
                <DataTable
                  rows={customer.invoices}
                  rowKey={(i) => i.id}
                  renderMobileCard={(i) => (
                    <div className="rounded-2xl border bg-white p-4 shadow-xs transition active:scale-[0.99]">
                      <div className="flex items-start justify-between gap-2 border-b pb-3">
                        <div>
                          <button
                            className="font-mono text-base font-bold text-primary hover:underline text-left block"
                            onClick={() => setViewing(i)}
                          >
                            {i.invoiceCode}
                          </button>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTime(i.completedAt ?? i.createdAt)}
                          </span>
                        </div>
                        <StatusBadge status={i.exportStatus} />
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-medium text-muted-foreground block">
                            Tổng tiền đơn
                          </span>
                          <strong className="text-base font-bold text-foreground">
                            {formatVnd(i.totalAmount)}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-muted-foreground block">
                            Thanh toán
                          </span>
                          {i.exportStatus === "CANCELLED" ? (
                            <span className="text-xs text-muted-foreground">Đã hủy</span>
                          ) : i.exportStatus === "EDITING" ? (
                            <span className="text-xs text-muted-foreground">Lưu nháp</span>
                          ) : i.paymentStatus === "PAID" ? (
                            <span className="text-xs font-semibold text-emerald-600">Đã trả đủ</span>
                          ) : i.paymentStatus === "PARTIAL" ? (
                            <span className="text-xs font-medium text-amber-600">
                              Còn nợ: {formatVnd(i.outstandingAmount ?? 0)}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-danger">
                              Chưa trả ({formatVnd(i.outstandingAmount ?? i.totalAmount)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 border-t pt-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs font-medium"
                          onClick={() => setViewing(i)}
                        >
                          Xem chi tiết hóa đơn
                        </Button>
                      </div>
                    </div>
                  )}
                  columns={[
                    {
                      key: "code",
                      label: "Mã hóa đơn",
                      render: (i) => (
                        <button
                          className="font-mono font-semibold text-primary hover:underline"
                          onClick={() => setViewing(i)}
                        >
                          {i.invoiceCode}
                        </button>
                      ),
                    },
                    {
                      key: "date",
                      label: "Ngày xuất",
                      render: (i) => formatDateTime(i.completedAt ?? i.createdAt),
                    },
                    {
                      key: "total",
                      label: "Tổng tiền đơn",
                      render: (i) => (
                        <strong className="text-foreground">{formatVnd(i.totalAmount)}</strong>
                      ),
                    },
                    {
                      key: "payment",
                      label: "Thanh toán",
                      render: (i) => {
                        if (i.exportStatus === "CANCELLED") return <span className="text-xs text-muted-foreground">Đã hủy</span>;
                        if (i.exportStatus === "EDITING") return <span className="text-xs text-muted-foreground">Lưu nháp</span>;
                        if (i.paymentStatus === "PAID") return <span className="text-xs font-semibold text-emerald-600">Đã trả đủ</span>;
                        if (i.paymentStatus === "PARTIAL") return <span className="text-xs font-medium text-amber-600">Còn nợ: {formatVnd(i.outstandingAmount ?? 0)}</span>;
                        return <span className="text-xs font-medium text-danger">Chưa trả ({formatVnd(i.outstandingAmount ?? i.totalAmount)})</span>;
                      },
                    },
                    {
                      key: "status",
                      label: "Trạng thái",
                      render: (i) => <StatusBadge status={i.exportStatus} />,
                    },
                    {
                      key: "open",
                      label: "",
                      className: "text-right",
                      render: (i) => (
                        <Button variant="outline" size="sm" onClick={() => setViewing(i)}>
                          Xem hóa đơn
                        </Button>
                      ),
                    },
                  ]}
                />

                {/* Phân trang danh sách đơn */}
                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trang trước
                  </Button>
                  <span className="self-center text-xs text-muted-foreground">
                    Trang {page} / {customer.meta?.totalPages ?? 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= (customer.meta?.totalPages ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Dialog hiển thị chi tiết hóa đơn */}
          <ExportDetailDialog
            invoice={viewing}
            open={!!viewing}
            onOpenChange={(open) => {
              if (!open) setViewing(null);
            }}
          />
        </div>
      )}
    </Page>
  );
}

