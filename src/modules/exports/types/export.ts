import type { Product } from "@/modules/products/types/product";
import type { PaginatedResponse } from "@/types/api";

export type ExportType = "AT_HOME" | "DELIVERY";
export type ExportStatus = "EDITING" | "COMPLETED" | "CANCELLED";

export interface ExportLineItem {
  id: string;
  productId: string;
  exportQuantity: number;
  unitPrice: number | null;
  lineNote: string | null;
  product: Product;
}

export interface ExportInvoice {
  id: string;
  invoiceCode: string;
  exportType: ExportType;
  exportStatus: ExportStatus;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  exportNote: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: ExportLineItem[];
  totalQuantity: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportInput {
  invoiceCode?: string;
  exportType?: ExportType;
  exportStatus?: ExportStatus;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  exportNote?: string;
  items: Array<{ productId: string; exportQuantity: number; lineNote?: string }>;
}

export type ExportList = PaginatedResponse<ExportInvoice>;
