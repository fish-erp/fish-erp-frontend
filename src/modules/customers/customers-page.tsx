"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { formatVnd } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { customerService, useCustomers, useInvalidateCustomers, type Customer } from "./customers";
import { CustomerEditor } from "./customer-editor";
export function CustomersPage() {
  const [search, setSearch] = useState(""); const [query, setQuery] = useState(""); const [page, setPage] = useState(1); const [debtOnly, setDebtOnly] = useState(false); const [archived, setArchived] = useState("false");
  const [editor, setEditor] = useState<Customer | "new" | null>(null); const [pending, setPending] = useState(false); const invalidate = useInvalidateCustomers();
  useEffect(() => { const t = setTimeout(() => { setQuery(search); setPage(1); }, 250); return () => clearTimeout(t); }, [search]);
  const list = useCustomers(query, page, debtOnly, archived);
  return <Page title="Khách hàng & công nợ" description="Quản lý hồ sơ khách hàng và số còn nợ theo từng hóa đơn đã hoàn tất." actions={<Button onClick={() => setEditor("new")}>+ Thêm khách hàng</Button>}>
    <div className="flex flex-wrap items-center gap-3"><Input className="min-w-48 flex-1" aria-label="Tìm khách hàng" placeholder="Tìm tên hoặc số điện thoại…" value={search} onChange={e => setSearch(e.target.value)} /><Select className="w-auto" aria-label="Trạng thái khách hàng" value={archived} onChange={e => { setArchived(e.target.value); setPage(1); }}><option value="false">Đang sử dụng</option><option value="true">Ngừng sử dụng</option><option value="all">Tất cả khách hàng</option></Select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={debtOnly} onChange={e => { setDebtOnly(e.target.checked); setPage(1); }} />Chỉ khách còn nợ</label></div>
    {list.isPending ? <p>Đang tải khách hàng…</p> : list.isError ? <p role="alert" className="text-danger">Không tải được khách hàng. <button onClick={() => void list.refetch()}>Thử lại</button></p> : !list.data?.data.length ? <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Chưa có khách hàng phù hợp.</p> : <DataTable rows={list.data.data} rowKey={c => c.id} columns={[
      { key: "name", label: "Khách hàng", render: c => <Link className="font-semibold text-primary hover:underline" href={`/admin/customers/${c.id}`}>{c.name}</Link> },
      { key: "phone", label: "Số điện thoại", render: c => c.phoneNumber },
      { key: "address", label: "Địa chỉ", render: c => <p className="max-w-64 whitespace-pre-wrap break-words">{c.address || "—"}</p> },
      { key: "debt", label: "Còn nợ", render: c => <div><strong className={c.outstandingAmount ? "text-danger" : "text-muted-foreground"}>{formatVnd(c.outstandingAmount ?? 0)}</strong>{!!c.unknownCount && <p className="text-xs">{c.unknownCount} phiếu chưa xác nhận</p>}</div> },
      { key: "actions", label: "Thao tác", render: c => <div className="flex flex-wrap gap-1"><Button size="sm" variant="ghost" onClick={() => setEditor(c)}>Sửa</Button><Button size="sm" variant="ghost" disabled={pending} onClick={async () => { setPending(true); try { await customerService.update(c.id, { archived: !c.archived }); await invalidate(); toast.success(c.archived ? "Đã khôi phục khách hàng" : "Đã ngừng sử dụng; lịch sử và công nợ vẫn giữ nguyên"); } catch (e) { toast.error(e instanceof Error ? e.message : "Không thể cập nhật"); } finally { setPending(false); } }}>{c.archived ? "Khôi phục" : "Ngừng sử dụng"}</Button></div> },
    ]} />}
    <div className="flex justify-end gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</Button><span className="self-center text-sm">{page}/{list.data?.meta.totalPages ?? 1}</span><Button variant="outline" disabled={page >= (list.data?.meta.totalPages ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</Button></div>
    {editor && <CustomerEditor customer={editor === "new" ? undefined : editor} onClose={() => setEditor(null)} />}
  </Page>;
}
