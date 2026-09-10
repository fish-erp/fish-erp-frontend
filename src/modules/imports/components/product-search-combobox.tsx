"use client";

import { Package, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVnd } from "@/lib/format";
import { useProducts } from "@/modules/products/hooks/use-products";
import type { Product } from "@/modules/products/types/product";

interface ProductSearchComboboxProps {
  selectedProduct: Product | null;
  onSelect: (product: Product | null) => void;
  onRequestCreateNew?: (searchTerm: string) => void;
  disabled?: boolean;
  mode?: "import" | "export";
}

export function ProductSearchCombobox({
  selectedProduct,
  onSelect,
  onRequestCreateNew,
  disabled = false,
  mode = "import",
}: ProductSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useProducts({
    page: 1,
    limit: 15,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    status: "SELLING",
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const products = data?.data ?? [];

  return (
    <div ref={containerRef} className="relative w-full">
      {selectedProduct ? (
        // Hiển thị sản phẩm đã chọn
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {selectedProduct.productName}
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono font-medium text-primary">
                  {selectedProduct.productCode}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>
                  Đơn vị: <strong>{selectedProduct.productUnit}</strong>
                </span>
                <span>
                  Tồn kho:{" "}
                  <strong className="text-foreground">
                    {selectedProduct.remainingQuantity} {selectedProduct.productUnit}
                  </strong>
                </span>
                <span>
                  Giá bán hiện tại: {formatVnd(selectedProduct.productPrice)}
                </span>
              </div>
            </div>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onSelect(null);
                setIsOpen(true);
              }}
              className="text-muted-foreground hover:text-danger"
              title="Chọn sản phẩm khác"
            >
              <X className="size-4" />
              Đổi sản phẩm
            </Button>
          )}
        </div>
      ) : (
        // Ô tìm kiếm và chọn sản phẩm
        <div>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                disabled={disabled}
                placeholder={`Tìm mã hoặc tên sản phẩm để ${mode === "export" ? "xuất kho" : "nhập kho"}...`}
                value={searchTerm}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                className="pl-9 pr-8"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {onRequestCreateNew && (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onRequestCreateNew(searchTerm)}
                className="shrink-0 text-primary hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="size-4" />
                Thêm sản phẩm mới
              </Button>
            )}
          </div>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border bg-white shadow-xl">
              <div className="p-2">
                {isLoading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Đang tìm kiếm sản phẩm...
                  </div>
                ) : products.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Không tìm thấy sản phẩm{" "}
                      {searchTerm ? `với từ khóa "${searchTerm}"` : "nào"}
                    </p>
                    {onRequestCreateNew && <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onRequestCreateNew(searchTerm);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <Plus className="size-3.5" />
                      Tạo ngay sản phẩm mới {searchTerm ? `"${searchTerm}"` : ""}
                    </button>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                      Danh sách sản phẩm phù hợp ({products.length})
                    </div>
                    {products.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelect(item);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {item.productName}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                              {item.productCode}
                            </span>
                          </div>
                          <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                            <span>Đơn vị: {item.productUnit}</span>
                            <span>
                              Tồn kho:{" "}
                              <strong className="text-foreground">
                                {item.remainingQuantity}
                              </strong>
                            </span>
                            <span>Giá bán: {formatVnd(item.productPrice)}</span>
                          </div>
                        </div>
                      </button>
                    ))}

                    {onRequestCreateNew && <div className="border-t pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onRequestCreateNew(searchTerm);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-primary hover:bg-primary/10"
                      >
                        <Plus className="size-3.5" />
                        Sản phẩm chưa có? Tạo mới sản phẩm
                      </button>
                    </div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
