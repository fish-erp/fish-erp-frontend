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
  customerId: string | null;
  paymentTracked: boolean;
  plannedPaidAmount: number | null;
  paidAmount: number | null;
  outstandingAmount: number | null;
  paymentStatus: "UNKNOWN" | "PAID" | "PARTIAL" | "UNPAID" | "DRAFT" | "CANCELLED";
  reconciliationNote?: string | null;
  payments: Array<{ id: string; amount: number; note: string | null; paidAt: string; createdBy: string; reversedAt: string | null; reversalReason: string | null }>;
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
  customerId?: string | null;
  paidAmount?: number | null;
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
