"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { ExportInvoice } from "@/modules/exports/types/export";
export interface Customer { id: string; name: string; phoneNumber: string; address: string | null; archived: boolean; outstandingAmount?: number; unknownCount?: number }
export interface CustomerInput { name: string; phoneNumber: string; address: string }
export const customerService = {
  create: (input: CustomerInput) => apiClient.post<Customer>("/api/backend/customers", input),
  update: (id: string, input: Partial<CustomerInput> & { archived?: boolean }) => apiClient.patch<Customer>(`/api/backend/customers/${id}`, input),
};
export function useCustomers(search: string, page = 1, debtOnly = false, archived = "false") {
  return useQuery({ queryKey: ["customers", { search, page, debtOnly, archived }], queryFn: ({ signal }) => apiClient.get<PaginatedResponse<Customer>>("/api/backend/customers", { params: { search, page, limit: 20, debtOnly: String(debtOnly), archived }, signal }) });
}
export function useCustomer(id: string, page: number) {
  return useQuery({ queryKey: ["customers", id, page], enabled: !!id, queryFn: () => apiClient.get<Customer & { invoices: ExportInvoice[]; meta: { totalPages: number; total: number } }>(`/api/backend/customers/${id}`, { params: { page, limit: 10 } }) });
}
export function useInvalidateCustomers() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["customers"] });
}
