"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  PackagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatVnd } from "@/lib/format";
import { ProductSearchCombobox } from "@/modules/imports/components/product-search-combobox";
import { QuickCreateProductDialog } from "@/modules/imports/components/quick-create-product-dialog";
import { useImportMutations } from "@/modules/imports/hooks/use-imports";
import type {
  CreateImportInput,
  CreateImportItemInput,
  ImportProductItem,
  ImportStatus,
} from "@/modules/imports/types/import";
import type { Product } from "@/modules/products/types/product";

interface ImportLineItem {
  id: string;
  product: Product | null;
  importQuantity: number | "";
  importPrice: number | "";
  expireDate: string;
  importNote: string;
}

const emptyItem = (): ImportLineItem => ({
  id: Math.random().toString(36).substring(2, 9),
  product: null,
  importQuantity: "",
  importPrice: "",
  expireDate: "",
  importNote: "",
});

interface CreateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingImport?: ImportProductItem | null;
  onSuccess?: () => void;
}

export function CreateImportDialog({
  open,
  onOpenChange,
  editingImport,
  onSuccess,
}: CreateImportDialogProps) {
  const mutations = useImportMutations();
  const [importCode, setImportCode] = useState("");
  const [importNote, setImportNote] = useState("");
  const [lineItems, setLineItems] = useState<ImportLineItem[]>([emptyItem()]);

  // Quick product create state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [searchNameForCreate, setSearchNameForCreate] = useState("");

  useEffect(() => {
    if (open) {
      if (editingImport) {
        setImportCode(editingImport.importCode);
        setImportNote(editingImport.importNote ?? "");

        if (editingImport.items && editingImport.items.length > 0) {
          setLineItems(
            editingImport.items.map((item) => ({
              id: item.id,
              product: item.product ?? null,
              importQuantity: item.importQuantity,
              importPrice: item.importPrice,
              expireDate: item.expireDate
                ? new Date(item.expireDate).toISOString().split("T")[0]
                : "",
              importNote: item.importNote ?? "",
            })),
          );
        } else {
          setLineItems([
            {
              id: editingImport.id,
              product: editingImport.product ?? null,
              importQuantity: editingImport.importQuantity,
              importPrice: editingImport.importPrice,
              expireDate: editingImport.expireDate
                ? new Date(editingImport.expireDate).toISOString().split("T")[0]
                : "",
              importNote: editingImport.importNote ?? "",
            },
          ]);
        }
      } else {
        setImportCode("");
        setImportNote("");
        setLineItems([emptyItem()]);
      }
    }
  }, [open, editingImport]);

  const handleAddLineItem = () => {
    setLineItems((prev) => [...prev, emptyItem()]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof ImportLineItem,
    value: any,
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleProductCreated = (newProduct: Product) => {
    if (activeLineIndex !== null) {
      handleUpdateLineItem(activeLineIndex, "product", newProduct);
      toast.success(
        `Đã tự động chọn sản phẩm "${newProduct.productName}" vào dòng nhập`,
      );
    }
    setActiveLineIndex(null);
  };

  const handleSave = async (targetStatus: ImportStatus) => {
    // Validate that all lines have products, quantity > 0, price >= 0
    const validLines = lineItems.filter((line) => line.product !== null);

    if (validLines.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để nhập kho");
      return;
    }

    for (let i = 0; i < lineItems.length; i++) {
      const line = lineItems[i];
      if (!line.product) {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn sản phẩm`);
        return;
      }
      const qty = Number(line.importQuantity);
      if (!qty || qty <= 0) {
        toast.error(
          `Dòng ${i + 1} (${line.product.productName}): Số lượng nhập phải lớn hơn 0`,
        );
        return;
      }
      const price = Number(line.importPrice);
      if (isNaN(price) || price < 0) {
        toast.error(
          `Dòng ${i + 1} (${line.product.productName}): Đơn giá nhập không hợp lệ`,
        );
        return;
      }
    }

    try {
      if (editingImport) {
        // Edit single import
        const first = lineItems[0];
        await mutations.update.mutateAsync({
          id: editingImport.id,
          input: {
            productId: first.product!.id,
            importQuantity: Number(first.importQuantity),
            importPrice: Number(first.importPrice),
            importCode: importCode.trim() || undefined,
            expireDate: first.expireDate
              ? new Date(first.expireDate).toISOString()
              : null,
            importNote: first.importNote.trim() || importNote.trim() || null,
            status: targetStatus,
          },
        });
        toast.success(
          targetStatus === "COMPLETED"
            ? "Đã hoàn thành nhập kho thành công"
            : "Đã cập nhật phiếu nhập kho",
        );
      } else {
        // Create multi-item import
        const itemsPayload: CreateImportItemInput[] = lineItems.map((line) => ({
          productId: line.product!.id,
          importQuantity: Number(line.importQuantity),
          importPrice: Number(line.importPrice),
          ...(line.expireDate
            ? { expireDate: new Date(line.expireDate).toISOString() }
            : {}),
          ...(line.importNote.trim()
            ? { importNote: line.importNote.trim() }
            : {}),
        }));

        const payload: CreateImportInput = {
          ...(importCode.trim() ? { importCode: importCode.trim() } : {}),
          ...(importNote.trim() ? { importNote: importNote.trim() } : {}),
          status: targetStatus,
          items: itemsPayload,
        };

        await mutations.create.mutateAsync(payload);
        toast.success(
          targetStatus === "COMPLETED"
            ? `Đã nhập kho thành công ${itemsPayload.length} sản phẩm! Tồn kho đã được cập nhật.`
            : `Đã lưu phiếu nhập ${itemsPayload.length} sản phẩm dưới dạng nháp.`,
        );
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu phiếu nhập kho",
      );
    }
  };

  const isSubmitting =
    mutations.create.isPending || mutations.update.isPending;

  const totalQuantity = lineItems.reduce(
    (sum, line) => sum + (Number(line.importQuantity) || 0),
    0,
  );

  const totalAmount = lineItems.reduce(
    (sum, line) =>
      sum + (Number(line.importQuantity) || 0) * (Number(line.importPrice) || 0),
    0,
  );

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[94vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <Dialog.Title className="flex items-center gap-2 text-xl font-bold text-primary">
                  <PackagePlus className="size-6" />
                  {editingImport ? "Chỉnh sửa phiếu nhập kho" : "Tạo phiếu nhập kho"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  Nhập một hoặc nhiều mặt hàng vào kho. Bạn có thể bấm nút &quot;+ Thêm sản phẩm&quot; để thêm dòng hàng.
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-2 hover:bg-muted">
                <X className="size-5" />
              </Dialog.Close>
            </div>

            <div className="mt-4 space-y-5">
              {/* Thông tin chung phiếu nhập */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl border bg-muted/20 p-4">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-foreground">
                    Mã phiếu nhập (Tùy chọn)
                  </span>
                  <Input
                    placeholder="Để trống hệ thống sẽ tự sinh (IMP-...)"
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold text-foreground">
                    Ghi chú chung phiếu nhập
                  </span>
                  <Input
                    placeholder="Ghi chú nhà cung cấp, số hóa đơn, xe hàng..."
                    value={importNote}
                    onChange={(e) => setImportNote(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              {/* Danh sách các sản phẩm nhập */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Danh sách sản phẩm nhập kho ({lineItems.length} mặt hàng)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                    disabled={isSubmitting}
                    className="gap-1.5 text-primary hover:bg-primary/5 hover:text-primary font-semibold"
                  >
                    <Plus className="size-4" />
                    + Thêm sản phẩm
                  </Button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((line, index) => {
                    const lineTotal =
                      (Number(line.importQuantity) || 0) *
                      (Number(line.importPrice) || 0);

                    return (
                      <div
                        key={line.id}
                        className="relative rounded-xl border bg-card p-3 shadow-xs hover:border-primary/40 transition"
                      >
                        <div className="mb-2 flex items-center justify-between border-b pb-1.5">
                          <span className="text-xs font-bold text-muted-foreground">
                            Mặt hàng #{index + 1}
                          </span>
                          {lineItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLineItem(index)}
                              className="h-7 px-2 text-xs text-danger hover:bg-danger-soft hover:text-danger"
                              title="Xóa mặt hàng này"
                            >
                              <Trash2 className="size-3.5" />
                              Xóa dòng
                            </Button>
                          )}
                        </div>

                        {/* Ô tìm kiếm / chọn sản phẩm */}
                        <div className="mb-3">
                          <ProductSearchCombobox
                            selectedProduct={line.product}
                            onSelect={(prod) =>
                              handleUpdateLineItem(index, "product", prod)
                            }
                            onRequestCreateNew={(search) => {
                              setActiveLineIndex(index);
                              setSearchNameForCreate(search);
                              setShowQuickCreate(true);
                            }}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Các trường số lượng, đơn giá, hạn dùng */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <label>
                            <span className="mb-1 block text-xs font-medium text-foreground">
                              Số lượng ({line.product ? line.product.productUnit : "Đơn vị"}){" "}
                              <span className="text-danger">*</span>
                            </span>
                            <Input
                              required
                              type="number"
                              min={1}
                              placeholder="Số lượng..."
                              value={line.importQuantity}
                              onChange={(e) =>
                                handleUpdateLineItem(
                                  index,
                                  "importQuantity",
                                  e.target.value === "" ? "" : Number(e.target.value),
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-medium text-foreground">
                              Đơn giá nhập (VNĐ) <span className="text-danger">*</span>
                            </span>
                            <Input
                              required
                              type="number"
                              min={0}
                              step={1000}
                              placeholder="Đơn giá..."
                              value={line.importPrice}
                              onChange={(e) =>
                                handleUpdateLineItem(
                                  index,
                                  "importPrice",
                                  e.target.value === "" ? "" : Number(e.target.value),
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-medium text-foreground">
                              Hạn sử dụng
                            </span>
                            <Input
                              type="date"
                              value={line.expireDate}
                              onChange={(e) =>
                                handleUpdateLineItem(
                                  index,
                                  "expireDate",
                                  e.target.value,
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </label>

                          <div>
                            <span className="mb-1 block text-xs font-medium text-foreground">
                              Thành tiền
                            </span>
                            <div className="flex h-10 items-center justify-end rounded-lg border bg-muted/40 px-3 font-mono font-bold text-primary text-sm">
                              {formatVnd(lineTotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tóm tắt tổng tiền phiếu nhập */}
              <div className="flex flex-wrap items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tổng kết phiếu nhập kho
                  </div>
                  <div className="text-sm text-foreground">
                    Số mặt hàng: <strong>{lineItems.length} sản phẩm</strong> · Tổng số lượng:{" "}
                    <strong>{totalQuantity}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Tổng giá trị thanh toán:</div>
                  <div className="text-2xl font-bold font-mono text-primary">
                    {formatVnd(totalAmount)}
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row border-t pt-4">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Hủy & Đóng
                  </Button>
                </Dialog.Close>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSave("DRAFT")}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <FileText className="size-4" />
                  Lưu phiếu nháp
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSave("COMPLETED")}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  {isSubmitting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Hoàn thành nhập kho (+ Tồn kho)
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Quick create product dialog */}
      <QuickCreateProductDialog
        open={showQuickCreate}
        onOpenChange={setShowQuickCreate}
        defaultName={searchNameForCreate}
        onSuccess={handleProductCreated}
      />
    </>
  );
}
