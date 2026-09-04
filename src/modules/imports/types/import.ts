import type { Product } from "@/modules/products/types/product";
import type { PaginatedResponse } from "@/types/api";

export type ImportStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface ImportLineItem {
  id: string;
  productId: string;
  importPrice: number;
  importQuantity: number;
  totalPrice: number;
  expireDate: string | null;
  lineNote: string | null;
  product: Product;
}

export interface ImportProductItem {
  id: string;
  importCode: string;
  importNote: string | null;
  status: ImportStatus;
  completedAt: string | null;
  cancelledAt: string | null;
  items: ImportLineItem[];
  totalQuantity: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImportItemInput {
  productId: string;
  importQuantity: number;
  importPrice: number;
  expireDate?: string;
  lineNote?: string;
}

export interface CreateImportInput {
  importCode?: string;
  importNote?: string;
  status?: ImportStatus;
  items: CreateImportItemInput[];
}

export interface UpdateImportInput {
  importCode?: string;
  importNote?: string;
  status?: ImportStatus;
  items?: CreateImportItemInput[];
}

export type ListImportsParams = {
  page: number;
  limit: number;
  search?: string;
  status?: ImportStatus;
  productId?: string;
  fromDate?: string;
  toDate?: string;
};

export type ImportList = PaginatedResponse<ImportProductItem>;
