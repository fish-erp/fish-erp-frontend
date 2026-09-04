import type { PaginatedResponse } from "@/types/api";
import type { Product } from "@/modules/products/types/product";

export type ImportStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface ImportProductItem {
  id: string;
  importCode: string;
  importPrice: number;
  importQuantity: number;
  totalPrice: number;
  expireDate: string | null;
  importNote: string | null;
  status: ImportStatus;
  completedAt: string | null;
  cancelledAt: string | null;
  productId: string;
  product?: Product;
  items?: ImportProductItem[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateImportItemInput {
  productId: string;
  importQuantity: number;
  importPrice: number;
  expireDate?: string;
  importNote?: string;
}

export interface CreateImportInput {
  productId?: string;
  importQuantity?: number;
  importPrice?: number;
  importCode?: string;
  expireDate?: string;
  importNote?: string;
  status?: ImportStatus;
  items?: CreateImportItemInput[];
}

export interface UpdateImportInput {
  productId?: string;
  importQuantity?: number;
  importPrice?: number;
  importCode?: string;
  expireDate?: string | null;
  importNote?: string | null;
  status?: ImportStatus;
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
