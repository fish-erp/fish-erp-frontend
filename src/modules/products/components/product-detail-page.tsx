"use client";

import { Boxes, Hash, Ruler, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatVnd } from "@/lib/format";
import { useProduct } from "@/modules/products/hooks/use-products";
import type { ProductType } from "@/modules/products/types/product";

const typeLabels: Record<ProductType, string> = {
  MEDICINE: "Thuốc",
  FEED: "Thức ăn",
  OTHER: "Khác",
  UNKNOWN: "Chưa xác định",
};

export function ProductDetailPage({ id }: { id: string }) {
  const query = useProduct(id);

  if (query.isLoading) {
    return (
      <Page title="Chi tiết sản phẩm">
        <div className="h-64 rounded-2xl skeleton" />
      </Page>
    );
  }

  if (!query.data) {
    return (
      <Page title="Không tìm thấy sản phẩm">
        <p className="text-danger">Không thể tải dữ liệu sản phẩm.</p>
      </Page>
    );
  }

  const product = query.data;
  const details: [typeof Hash, string, string][] = [
    [Hash, "Mã sản phẩm", product.productCode],
    [Tag, "Loại", typeLabels[product.type]],
    [Ruler, "Đơn vị", product.productUnit],
    [Boxes, "Tồn kho", `${product.remainingQuantity} ${product.productUnit}`],
  ];

  return (
    <Page
      title="Chi tiết sản phẩm"
      description="Thông tin sản phẩm và tình trạng tồn kho."
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="text-center">
          <span className="mx-auto grid size-24 place-items-center rounded-full bg-secondary text-3xl font-bold text-primary">
            📦
          </span>
          <h2 className="mt-4 text-xl font-bold">{product.productName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{product.id}</p>
          <div className="mt-4">
            <StatusBadge status={product.status} />
          </div>
          <p className="mt-4 text-2xl font-bold tabular tracking-tight text-primary">
            {formatVnd(product.productPrice)}
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Thông tin sản phẩm</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {details.map(([Icon, label, value]) => (
              <div key={label} className="rounded-xl bg-muted p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <Icon className="size-4" />
                  {label}
                </dt>
                <dd className="mt-2 break-all font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {product.productNote && (
            <div className="mt-5 rounded-xl bg-muted p-4">
              <dt className="text-xs font-semibold uppercase text-muted-foreground">
                Ghi chú
              </dt>
              <dd className="mt-2 whitespace-pre-wrap">{product.productNote}</dd>
            </div>
          )}
          <p className="mt-5 text-sm text-muted-foreground">
            Tạo lúc {formatDateTime(product.createdAt)} · Cập nhật{" "}
            {formatDateTime(product.updatedAt)}
          </p>
        </Card>
      </div>
    </Page>
  );
}
