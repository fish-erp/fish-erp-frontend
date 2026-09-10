"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { ExportInvoice } from "@/modules/exports/types/export";
export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  address: string | null;
  archived: boolean;
  totalPurchased?: number;
  totalPaid?: number;
  outstandingAmount?: number;
  advanceAmount?: number; // Tiền trả trước
}

export interface CustomerInput {
  name: string;
  phoneNumber: string;
  address: string;
}

export interface CustomerPayment {
  id: string;
  amount: number;
  note: string | null;
  paidAt: string;
  invoiceId?: string | null;
  createdBy: string;
  reversedAt: string | null;
  reversedBy?: string | null;
  reversalReason: string | null;
}

export interface CustomerDetail extends Customer {
  totalPurchased: number;
  totalPaid: number;
  outstandingAmount: number;
  advanceAmount: number; // Tiền trả trước
  invoices: ExportInvoice[];
  payments: CustomerPayment[];
  meta: {
    totalPages: number;
    total: number;
  };
}

export interface CustomerPaymentInput {
  amount: number;
  idempotencyKey: string;
  note?: string;
  paidAt?: string;
}

export interface CustomerReversalInput {
  reason: string;
}

export const customerService = {
  create: (input: CustomerInput) => apiClient.post<Customer>("/api/backend/customers", input),
  update: (id: string, input: Partial<CustomerInput> & { archived?: boolean }) =>
    apiClient.patch<Customer>(`/api/backend/customers/${id}`, input),
  // Thu tiền nợ khách hàng
  addPayment: (id: string, input: CustomerPaymentInput) =>
    apiClient.post<CustomerDetail>(`/api/backend/customers/${id}/payments`, input),
  // Hoàn/đảo phiếu thu tiền
  reversePayment: (id: string, paymentId: string, input: CustomerReversalInput) =>
    apiClient.post<CustomerDetail>(`/api/backend/customers/${id}/payments/${paymentId}/reverse`, input),
};

export function useCustomers(search: string, page = 1, debtOnly = false, archived = "false") {
  return useQuery({
    queryKey: ["customers", { search, page, debtOnly, archived }],
    queryFn: ({ signal }) =>
      apiClient.get<PaginatedResponse<Customer>>("/api/backend/customers", {
        params: { search, page, limit: 20, debtOnly: String(debtOnly), archived },
        signal,
      }),
  });
}

export function useCustomer(id: string, page: number) {
  return useQuery({
    queryKey: ["customers", id, page],
    enabled: !!id,
    queryFn: () =>
      apiClient.get<CustomerDetail>(`/api/backend/customers/${id}`, {
        params: { page, limit: 10 },
      }),
  });
}

export function useInvalidateCustomers() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["customers"] });
}
