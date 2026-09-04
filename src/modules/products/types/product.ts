import type { PaginatedResponse } from "@/types/api";

export type ProductType = "MEDICINE" | "FEED" | "OTHER" | "UNKNOWN";
export type ProductStatus = "SELLING" | "PAUSED" | "DISCONTINUED";

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  productPrice: number;
  remainingQuantity: number;
  productUnit: string;
  productNote: string | null;
  type: ProductType;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  productCode: string;
  productName: string;
  productPrice: number;
  productUnit: string;
  productNote?: string;
  type: ProductType;
  status: ProductStatus;
}

export type ProductList = PaginatedResponse<Product>;
