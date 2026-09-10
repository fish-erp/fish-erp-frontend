import { apiClient } from "@/lib/api/client";
import type { QueryParamValue } from "@/types/api";
import type { ExportInput, ExportInvoice, ExportList, ExportStatus, ExportType } from "../types/export";

export const exportsService = {
  list: (params: { page: number; limit: number; search?: string; exportStatus?: ExportStatus; exportType?: ExportType }, signal?: AbortSignal) =>
    apiClient.get<ExportList>("/api/backend/exports", { params: params as Record<string, QueryParamValue>, signal }),
  detail: (id: string) => apiClient.get<ExportInvoice>(`/api/backend/exports/${id}`),
  create: (input: ExportInput) => apiClient.post<ExportInvoice>("/api/backend/exports", input),
  update: (id: string, input: Partial<ExportInput>) => apiClient.patch<ExportInvoice>(`/api/backend/exports/${id}`, input),
  complete: (id: string) => apiClient.post<ExportInvoice>(`/api/backend/exports/${id}/complete`),
  cancel: (id: string) => apiClient.post<ExportInvoice>(`/api/backend/exports/${id}/cancel`),
  remove: (id: string) => apiClient.delete<void>(`/api/backend/exports/${id}`),
};
