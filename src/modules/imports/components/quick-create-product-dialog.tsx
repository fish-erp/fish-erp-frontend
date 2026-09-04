"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { productsService } from "@/modules/products/services/products.service";
import type {
  Product,
  ProductInput,
  ProductStatus,
  ProductType,
} from "@/modules/products/types/product";

const typeLabels: Record<ProductType, string> = {
  MEDICINE: "Thuốc",
  FEED: "Thức ăn",
  OTHER: "Khác",
  UNKNOWN: "Chưa xác định",
};

const statusLabels: Record<ProductStatus, string> = {
  SELLING: "Đang bán",
  PAUSED: "Tạm ngưng",
  DISCONTINUED: "Ngừng kinh doanh",
};

const typeOptions: ProductType[] = ["MEDICINE", "FEED", "OTHER", "UNKNOWN"];
const statusOptions: ProductStatus[] = ["SELLING", "PAUSED", "DISCONTINUED"];

interface QuickCreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  onSuccess: (product: Product) => void;
}

export function QuickCreateProductDialog({
  open,
  onOpenChange,
  defaultName = "",
  onSuccess,
}: QuickCreateProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductInput>({
    productCode: "",
    productName: "",
    productPrice: 0,
    productUnit: "",
    productNote: "",
    type: "UNKNOWN",
    status: "SELLING",
  });

  useEffect(() => {
    if (open) {
      // Auto generate suggested product code based on timestamp
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      // Form state is intentionally reset when a new quick-create dialog opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        productCode: `SP-${randomSuffix}`,
        productName: defaultName,
        productPrice: 0,
        productUnit: "",
        productNote: "",
        type: "UNKNOWN",
        status: "SELLING",
      });
    }
  }, [open, defaultName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productCode.trim() || !form.productName.trim() || !form.productUnit.trim()) {
      toast.error("Vui lòng điền đầy đủ mã, tên và đơn vị sản phẩm");
      return;
    }

    try {
      setLoading(true);
      const payload: ProductInput = {
        ...form,
        productCode: form.productCode.trim(),
        productName: form.productName.trim(),
        productUnit: form.productUnit.trim(),
        productPrice: Number(form.productPrice) || 0,
        ...(form.productNote?.trim() ? { productNote: form.productNote.trim() } : {}),
      };

      const created = await productsService.create(payload);
      toast.success(`Đã tạo mới sản phẩm "${created.productName}"`);
      onSuccess(created);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between border-b pb-3">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-lg font-bold text-primary">
                <Plus className="size-5" />
                Thêm nhanh sản phẩm mới
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                Sản phẩm sau khi tạo sẽ tự động được chọn vào phiếu nhập kho.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-2 hover:bg-muted">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-semibold text-foreground">
                  Mã sản phẩm <span className="text-danger">*</span>
                </span>
                <Input
                  required
                  placeholder="Ví dụ: SP-0100"
                  value={form.productCode}
                  onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold text-foreground">
                  Đơn vị tính <span className="text-danger">*</span>
                </span>
                <Input
                  required
                  placeholder="chai, gói, kg, lít..."
                  value={form.productUnit}
                  onChange={(e) => setForm({ ...form, productUnit: e.target.value })}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-foreground">
                Tên sản phẩm <span className="text-danger">*</span>
              </span>
              <Input
                required
                placeholder="Nhập tên sản phẩm mới..."
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-semibold text-foreground">
                  Giá bán dự kiến (VNĐ) <span className="text-danger">*</span>
                </span>
                <Input
                  required
                  type="number"
                  min={0}
                  step={1000}
                  value={form.productPrice}
                  onChange={(e) =>
                    setForm({ ...form, productPrice: Number(e.target.value) })
                  }
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold text-foreground">
                  Loại sản phẩm
                </span>
                <Select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as ProductType })
                  }
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {typeLabels[type]}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-foreground">
                Trạng thái kinh doanh
              </span>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as ProductStatus })
                }
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-foreground">
                Ghi chú sản phẩm
              </span>
              <Textarea
                rows={2}
                placeholder="Ghi chú thêm về thành phần, nhà cung cấp..."
                value={form.productNote}
                onChange={(e) => setForm({ ...form, productNote: e.target.value })}
              />
            </label>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Hủy
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={loading}>
                {loading && <LoaderCircle className="animate-spin" />}
                Lưu & Điền vào phiếu nhập
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
