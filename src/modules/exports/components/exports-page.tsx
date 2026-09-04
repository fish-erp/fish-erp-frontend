"use client";

import { Ban, CheckCircle2, Eye, PackageMinus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import { Page } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatVnd } from "@/lib/format";
import { CreateExportDialog } from "./create-export-dialog";
import { ExportDetailDialog } from "./export-detail-dialog";
import { useExportMutations, useExports } from "../hooks/use-exports";
import type { ExportInvoice, ExportStatus } from "../types/export";

export function ExportsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ExportStatus | "">("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ExportInvoice | null>(null);
  const [viewing, setViewing] = useState<ExportInvoice | null>(null);
  const [action, setAction] = useState<{ type: "complete" | "cancel" | "delete"; id: string } | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  const list = useExports({ page, limit: 20, ...(query ? { search: query } : {}), ...(status ? { exportStatus: status } : {}) });
  const mutations = useExportMutations();

  const confirm = async () => {
    if (!action) return;
    try {
      if (action.type === "complete") await mutations.complete.mutateAsync(action.id);
      if (action.type === "cancel") await mutations.cancel.mutateAsync(action.id);
      if (action.type === "delete") await mutations.remove.mutateAsync(action.id);
      toast.success(action.type === "complete" ? "Đã hoàn tất và trừ tồn kho" : action.type === "cancel" ? "Đã hủy và hoàn lại tồn kho" : "Đã xóa phiếu xuất");
      setAction(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể xử lý phiếu xuất"); }
  };

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  return <Page title="Quản lý xuất hàng" description="Tạo hóa đơn nhiều sản phẩm và kiểm soát tồn kho khi hoàn tất." actions={<Button onClick={() => { setEditing(null); setEditorOpen(true); }}><Plus className="size-4" />Tạo phiếu xuất</Button>}>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã phiếu, khách hàng hoặc sản phẩm..." /></div><Select className="sm:w-52" value={status} onChange={(event) => { setStatus(event.target.value as ExportStatus | ""); setPage(1); }}><option value="">Tất cả trạng thái</option><option value="COMPLETED">Đã hoàn thành</option><option value="EDITING">Lưu nháp</option><option value="CANCELLED">Đã hủy</option></Select></div>
    {list.isLoading ? <div className="h-64 rounded-2xl skeleton" /> : rows.length === 0 ? <div className="rounded-2xl border border-dashed p-14 text-center"><PackageMinus className="mx-auto size-10 text-muted-foreground" /><h3 className="mt-3 font-semibold">Chưa có phiếu xuất hàng</h3></div> : <DataTable rows={rows} rowKey={(row) => row.id} columns={[
      { key: "code", label: "Mã phiếu", render: (row) => <button className="font-mono font-semibold text-primary hover:underline" onClick={() => setViewing(row)}>{row.invoiceCode}<span className="block font-sans text-xs font-normal text-muted-foreground">{formatDateTime(row.completedAt ?? row.createdAt)}</span></button> },
      { key: "customer", label: "Khách hàng", render: (row) => <div>{row.customerName || "Khách lẻ"}<p className="text-xs text-muted-foreground">{row.customerPhone || (row.exportType === "DELIVERY" ? "Giao hàng" : "Bán tại nhà")}</p></div> },
      { key: "items", label: "Sản phẩm", render: (row) => <div>{row.items.slice(0, 2).map((item) => item.product.productName).join(", ")}{row.items.length > 2 ? ` (+${row.items.length - 2})` : ""}<p className="text-xs text-muted-foreground">{row.totalQuantity} đơn vị</p></div> },
      { key: "amount", label: "Tổng tiền", render: (row) => <strong className="text-primary">{formatVnd(row.totalAmount)}</strong> },
      { key: "status", label: "Trạng thái", render: (row) => <StatusBadge status={row.exportStatus} /> },
      { key: "actions", label: "", className: "text-right", render: (row) => <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Xem" onClick={() => setViewing(row)}><Eye className="size-4" /></Button>{row.exportStatus === "EDITING" && <><Button variant="ghost" size="icon" title="Sửa" onClick={() => { setEditing(row); setEditorOpen(true); }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" title="Hoàn tất" className="text-success" onClick={() => setAction({ type: "complete", id: row.id })}><CheckCircle2 className="size-4" /></Button></>}{row.exportStatus !== "CANCELLED" && <Button variant="ghost" size="icon" title="Hủy" className="text-danger" onClick={() => setAction({ type: "cancel", id: row.id })}><Ban className="size-4" /></Button>}{row.exportStatus !== "COMPLETED" && <Button variant="ghost" size="icon" title="Xóa" onClick={() => setAction({ type: "delete", id: row.id })}><Trash2 className="size-4" /></Button>}</div> },
    ]} />}
    {meta && meta.totalPages > 1 && <div className="flex items-center justify-end gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trang trước</Button><span className="text-sm">{page}/{meta.totalPages}</span><Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div>}
    <CreateExportDialog open={editorOpen} onOpenChange={setEditorOpen} editing={editing} />
    <ExportDetailDialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)} invoice={viewing} />
    <ConfirmDialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)} title={action?.type === "complete" ? "Hoàn tất phiếu xuất?" : action?.type === "cancel" ? "Hủy phiếu xuất?" : "Xóa phiếu xuất?"} description={action?.type === "complete" ? "Tồn kho sẽ bị trừ ngay." : action?.type === "cancel" ? "Nếu phiếu đã hoàn thành, hàng sẽ được hoàn lại kho." : "Phiếu sẽ được xóa mềm."} confirmLabel="Xác nhận" onConfirm={() => void confirm()} />
  </Page>;
}
