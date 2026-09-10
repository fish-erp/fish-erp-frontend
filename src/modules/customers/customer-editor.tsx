"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { customerService, useInvalidateCustomers, type Customer } from "./customers";

// Mount on open so cancelling a nested quick-create never resets its parent invoice.
export function CustomerEditor({ customer, initialSearch = "", onClose, onSaved }: { customer?: Customer; initialSearch?: string; onClose: () => void; onSaved?: (customer: Customer) => void }) {
  const [name, setName] = useState(customer?.name ?? (/^[+\d\s.-]+$/.test(initialSearch) ? "" : initialSearch));
  const [phoneNumber, setPhone] = useState(customer?.phoneNumber ?? (/^[+\d\s.-]+$/.test(initialSearch) ? initialSearch : ""));
  const [address, setAddress] = useState(customer?.address ?? "");
  const [pending, setPending] = useState(false);
  const invalidate = useInvalidateCustomers();
  return <Dialog.Root open onOpenChange={open => { if (!open && !pending) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[60] bg-foreground/40" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between"><Dialog.Title className="text-xl font-bold">{customer ? "Sửa khách hàng" : "Thêm khách hàng"}</Dialog.Title><Dialog.Close disabled={pending} aria-label="Đóng" className="p-2"><X /></Dialog.Close></div>
      <Dialog.Description className="mt-2 text-sm text-muted-foreground">Số điện thoại dùng để nhận diện khách, tránh trùng hồ sơ.</Dialog.Description>
      <form className="mt-5 space-y-4" onSubmit={async event => {
        event.preventDefault(); if (pending) return; setPending(true);
        try { const input = { name: name.trim(), phoneNumber: phoneNumber.trim(), address: address.trim() }; const result = customer ? await customerService.update(customer.id, input) : await customerService.create(input); await invalidate(); toast.success("Đã lưu khách hàng"); onSaved?.(result); onClose(); }
        catch (error) { toast.error(error instanceof Error ? error.message : "Không thể lưu khách hàng"); }
        finally { setPending(false); }
      }}>
        <label className="block text-sm font-medium">Tên khách hàng<Input autoFocus required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block text-sm font-medium">Số điện thoại<Input required type="tel" maxLength={20} value={phoneNumber} onChange={e => setPhone(e.target.value)} /></label>
        <label className="block text-sm font-medium">Địa chỉ<Textarea maxLength={500} value={address} onChange={e => setAddress(e.target.value)} /></label>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Đóng</Button><Button disabled={pending || !name.trim() || !phoneNumber.trim()}>{pending ? "Đang lưu…" : customer ? "Lưu thay đổi" : "Tạo khách hàng"}</Button></div>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
