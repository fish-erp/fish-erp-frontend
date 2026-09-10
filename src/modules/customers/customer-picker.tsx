"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomers, type Customer } from "./customers";
import { CustomerEditor } from "./customer-editor";
export function CustomerPicker({ selected, onSelect, disabled = false }: { selected: Pick<Customer, "id" | "name" | "phoneNumber"> | null; onSelect: (customer: Customer | null) => void; disabled?: boolean }) {
  const [search, setSearch] = useState(""); const [query, setQuery] = useState(""); const [creating, setCreating] = useState(false); const [expanded, setExpanded] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setQuery(search), 250); return () => clearTimeout(timer); }, [search]);
  const list = useCustomers(query);
  return <div className="space-y-2 rounded-xl border p-3">
    <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">Khách hàng</span><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setCreating(true)}>+ Khách hàng mới</Button></div>
    {selected ? <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary p-2 text-sm"><span><strong>{selected.name}</strong> · {selected.phoneNumber}</span><Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { onSelect(null); setExpanded(true); }}>Đổi khách</Button></div> : <p className="text-xs text-muted-foreground">Chưa chọn — khách lẻ cần thanh toán đủ khi hoàn tất.</p>}
    {(!selected || expanded) && <><Input aria-label="Tìm khách hàng" placeholder="Tìm tên hoặc số điện thoại…" disabled={disabled} value={search} onFocus={() => setExpanded(true)} onChange={e => { setSearch(e.target.value); setExpanded(true); }} />
    {expanded && <div className="max-h-44 overflow-y-auto" aria-label="Kết quả khách hàng">
      {list.isPending ? <p className="p-2 text-sm">Đang tìm…</p> : list.isError ? <p role="alert" className="p-2 text-sm text-danger">Không tải được khách hàng. <button type="button" onClick={() => void list.refetch()}>Thử lại</button></p> : list.data?.data.length ? list.data.data.map(c => <button type="button" key={c.id} disabled={disabled} className="block w-full rounded-lg p-2 text-left text-sm hover:bg-secondary focus-visible:outline-primary" onClick={() => { onSelect(c); setExpanded(false); setSearch(""); }}><strong>{c.name}</strong><span className="ml-2 text-muted-foreground">{c.phoneNumber}</span></button>) : <p className="p-2 text-sm text-muted-foreground">Chưa tìm thấy. Bấm “Khách hàng mới” để tạo ngay.</p>}
    </div>}</>}
    {creating && <CustomerEditor initialSearch={search} onClose={() => setCreating(false)} onSaved={c => { onSelect(c); setExpanded(false); setSearch(""); }} />}
  </div>;
}
