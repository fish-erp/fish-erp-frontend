"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { Link } from "@/i18n/navigation";
import { formatVnd } from "@/lib/format";
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
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="min-w-48 flex-1"
          aria-label="Tìm khách hàng"
          placeholder="Tìm tên hoặc số điện thoại…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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

      {list.isPending ? (
        <div className="h-64 rounded-2xl skeleton" />
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
        <DataTable
          rows={list.data.data}
          rowKey={(c) => c.id}
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
      )}

      {/* Phân trang danh sách */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Trang trước
        </Button>
        <span className="self-center text-sm text-muted-foreground">
          {page} / {list.data?.meta.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          disabled={page >= (list.data?.meta.totalPages ?? 1)}
          onClick={() => setPage(page + 1)}
        >
          Trang sau
        </Button>
      </div>

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

