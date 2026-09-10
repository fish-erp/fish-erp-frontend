"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Plus, Search, UserPlus, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { Link } from "@/i18n/navigation";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CustomerEditor } from "./customer-editor";
import { customerService, useCustomers, useInvalidateCustomers, type Customer } from "./customers";

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [debtOnly, setDebtOnly] = useState(false);
  const [archived, setArchived] = useState("false");
  const [editor, setEditor] = useState<Customer | "new" | null>(null);
  const [pending, setPending] = useState(false);

  const invalidate = useInvalidateCustomers();

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const list = useCustomers(query, page, debtOnly, archived);

  return (
    <Page
      title="Khách hàng & công nợ"
      description="Quản lý hồ sơ khách hàng, theo dõi công nợ tập trung và ghi nhận thanh toán."
      actions={<Button onClick={() => setEditor("new")}>+ Thêm khách hàng</Button>}
    >
      {/* Bộ lọc và thanh tìm kiếm */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-10 h-10 rounded-xl bg-white shadow-2xs"
            aria-label="Tìm khách hàng"
            placeholder="Tìm tên hoặc số điện thoại…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Filter Row */}
        <div className="hidden sm:flex sm:items-center gap-3">
          <Select
            className="w-auto"
            aria-label="Trạng thái khách hàng"
            value={archived}
            onChange={(e) => {
              setArchived(e.target.value);
              setPage(1);
            }}
          >
            <option value="false">Đang sử dụng</option>
            <option value="true">Ngừng sử dụng</option>
            <option value="all">Tất cả khách hàng</option>
          </Select>
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 rounded accent-primary"
              checked={debtOnly}
              onChange={(e) => {
                setDebtOnly(e.target.checked);
                setPage(1);
              }}
            />
            Chỉ khách còn nợ
          </label>
        </div>

        {/* Mobile Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs sm:hidden">
          {[
            { value: "false", label: "Đang sử dụng" },
            { value: "all", label: "Tất cả khách" },
            { value: "true", label: "Ngừng sử dụng" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setArchived(item.value);
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 font-medium transition active:scale-95",
                archived === item.value
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-muted-foreground border hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setDebtOnly(!debtOnly);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 font-medium transition active:scale-95 border",
              debtOnly
                ? "bg-danger text-white border-danger shadow-xs"
                : "bg-white text-danger border-danger/40 hover:bg-danger-soft",
            )}
          >
            {debtOnly ? "✓ Đang lọc: Còn nợ" : "Chỉ khách còn nợ"}
          </button>
        </div>
      </div>

      {list.isPending ? (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
        </div>
      ) : list.isError ? (
        <div className="rounded-xl border border-danger/30 p-6 text-center text-danger">
          <p>Không tải được dữ liệu khách hàng.</p>
          <Button variant="outline" className="mt-3" onClick={() => void list.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : !list.data?.data.length ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Chưa có khách hàng phù hợp với điều kiện tìm kiếm.
        </p>
      ) : (
        <>
          <DataTable
            rows={list.data.data}
            rowKey={(c) => c.id}
            renderMobileCard={(c) => (
              <div className="rounded-2xl border bg-white p-4 shadow-xs transition active:scale-[0.99]">
                {/* Header: Tên khách + Gọi điện nhanh */}
                <div className="flex items-start justify-between gap-2 border-b pb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        className="text-base font-bold text-foreground hover:text-primary hover:underline line-clamp-1"
                        href={`/admin/customers/${c.id}`}
                      >
                        {c.name}
                      </Link>
                      {c.archived && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Ngừng dùng
                        </span>
                      )}
                    </div>
                    {c.phoneNumber ? (
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                        {c.phoneNumber}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground italic">
                        Chưa có số điện thoại
                      </p>
                    )}
                  </div>

                  {c.phoneNumber && (
                    <a
                      href={`tel:${c.phoneNumber}`}
                      aria-label={`Gọi cho ${c.name}`}
                      className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95"
                    >
                      <Phone className="size-4" />
                    </a>
                  )}
                </div>

                {/* Body: Tài chính & Địa chỉ */}
                <div className="mt-3 space-y-2.5">
                  {/* Khối Công nợ / Tiền trả trước */}
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={cn(
                        "rounded-xl p-2.5",
                        (c.outstandingAmount ?? 0) > 0
                          ? "bg-danger-soft border border-danger/20"
                          : "bg-muted/40",
                      )}
                    >
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Công nợ hiện tại
                      </span>
                      <strong
                        className={cn(
                          "text-sm font-bold tabular tracking-tight",
                          (c.outstandingAmount ?? 0) > 0 ? "text-danger" : "text-muted-foreground",
                        )}
                      >
                        {c.outstandingAmount ? formatVnd(c.outstandingAmount) : "Hết nợ"}
                      </strong>
                    </div>

                    <div
                      className={cn(
                        "rounded-xl p-2.5",
                        (c.advanceAmount ?? 0) > 0
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-muted/40",
                      )}
                    >
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Tiền trả trước
                      </span>
                      <strong
                        className={cn(
                          "text-sm font-bold tabular tracking-tight",
                          (c.advanceAmount ?? 0) > 0 ? "text-emerald-600" : "text-muted-foreground",
                        )}
                      >
                        {c.advanceAmount ? `+${formatVnd(c.advanceAmount)}` : "0 ₫"}
                      </strong>
                    </div>
                  </div>

                  {/* Địa chỉ & Tổng mua */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span className="truncate max-w-[60%]">
                      {c.address ? `📍 ${c.address}` : "Chưa có địa chỉ"}
                    </span>
                    <span>
                      Đã mua: <strong className="text-foreground">{formatVnd(c.totalPurchased ?? 0)}</strong>
                    </span>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-3 flex items-center justify-between gap-1.5 border-t pt-2.5">
                  <Link href={`/admin/customers/${c.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs font-semibold text-primary">
                      Thu nợ & Lịch sử
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditor(c)}
                    className="h-8 text-xs px-2.5"
                  >
                    <Pencil className="size-3.5 mr-1" />
                    Sửa
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    className={cn(
                      "h-8 text-xs px-2",
                      c.archived ? "text-primary" : "text-muted-foreground",
                    )}
                    onClick={async () => {
                      setPending(true);
                      try {
                        await customerService.update(c.id, { archived: !c.archived });
                        await invalidate();
                        toast.success(
                          c.archived
                            ? "Đã khôi phục khách hàng"
                            : "Đã ngừng sử dụng; lịch sử và công nợ vẫn giữ nguyên",
                        );
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Không thể cập nhật");
                      } finally {
                        setPending(false);
                      }
                    }}
                  >
                    {c.archived ? "Khôi phục" : "Ngừng"}
                  </Button>
                </div>
              </div>
            )}
            columns={[
              {
                key: "name",
                label: "Khách hàng",
                render: (c) => (
                  <Link
                    className="font-semibold text-primary hover:underline"
                    href={`/admin/customers/${c.id}`}
                  >
                    {c.name}
                    {c.archived && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                        Ngừng sử dụng
                      </span>
                    )}
                  </Link>
                ),
              },
              {
                key: "phone",
                label: "Số điện thoại",
                render: (c) => <span className="font-mono text-sm">{c.phoneNumber}</span>,
              },
              {
                key: "address",
                label: "Địa chỉ",
                render: (c) => (
                  <p className="max-w-64 line-clamp-1 text-xs text-muted-foreground" title={c.address ?? ""}>
                    {c.address || "—"}
                  </p>
                ),
              },
              {
                key: "purchased",
                label: "Tổng tiền mua",
                render: (c) => (
                  <span className="text-sm font-medium">{formatVnd(c.totalPurchased ?? 0)}</span>
                ),
              },
              {
                key: "paid",
                label: "Đã thanh toán",
                render: (c) => (
                  <span className="text-sm font-medium text-blue-600">
                    {formatVnd(c.totalPaid ?? 0)}
                  </span>
                ),
              },
              {
                key: "debt",
                label: "Tiền nợ",
                render: (c) => (
                  <strong className={c.outstandingAmount ? "text-danger" : "font-normal text-muted-foreground"}>
                    {formatVnd(c.outstandingAmount ?? 0)}
                  </strong>
                ),
              },
              {
                key: "advance",
                label: "Tiền trả trước",
                render: (c) => (
                  <span className={c.advanceAmount ? "font-semibold text-emerald-600" : "font-normal text-muted-foreground"}>
                    {c.advanceAmount ? `+${formatVnd(c.advanceAmount)}` : "0 ₫"}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Thao tác",
                className: "text-right",
                render: (c) => (
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/admin/customers/${c.id}`}>
                      <Button size="sm" variant="outline">
                        Thu nợ & Chi tiết
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => setEditor(c)}>
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      className={c.archived ? "text-primary" : "text-muted-foreground"}
                      onClick={async () => {
                        setPending(true);
                        try {
                          await customerService.update(c.id, { archived: !c.archived });
                          await invalidate();
                          toast.success(
                            c.archived
                              ? "Đã khôi phục khách hàng"
                              : "Đã ngừng sử dụng; lịch sử và công nợ vẫn giữ nguyên",
                          );
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Không thể cập nhật");
                        } finally {
                          setPending(false);
                        }
                      }}
                    >
                      {c.archived ? "Khôi phục" : "Ngừng dùng"}
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          {/* Floating Action Button for Mobile */}
          <div className="fixed bottom-20 right-4 z-30 lg:hidden">
            <button
              onClick={() => setEditor("new")}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xl transition active:scale-95"
            >
              <Plus className="size-5" />
              <span>Thêm khách</span>
            </button>
          </div>

          {/* Phân trang danh sách */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>{list.data?.meta.total ?? 0} khách hàng</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-9 px-3 text-xs"
              >
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Trước</span>
              </Button>
              <span className="text-xs font-medium px-2">
                Trang {page} / {list.data?.meta.totalPages ?? 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (list.data?.meta.totalPages ?? 1)}
                onClick={() => setPage(page + 1)}
                className="h-9 px-3 text-xs"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modal sửa hoặc thêm mới khách hàng */}
      {editor && (
        <CustomerEditor
          customer={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </Page>
  );
}

