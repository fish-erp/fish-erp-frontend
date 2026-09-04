import { apiClient } from "@/lib/api/client";
import type {
  CreateImportInput,
  ImportList,
  ImportProductItem,
  ListImportsParams,
  UpdateImportInput,
} from "@/modules/imports/types/import";

import type { QueryParamValue } from "@/types/api";

export const importsService = {
  list: (params: ListImportsParams, signal?: AbortSignal) =>
    apiClient.get<ImportList>("/api/backend/imports", {
      params: params as unknown as Record<string, QueryParamValue>,
      signal,
    }),
  detail: (id: string) =>
    apiClient.get<ImportProductItem>(`/api/backend/imports/${id}`),
  create: (input: CreateImportInput) =>
    apiClient.post<ImportProductItem>("/api/backend/imports", input),
  update: (id: string, input: UpdateImportInput) =>
    apiClient.patch<ImportProductItem>(`/api/backend/imports/${id}`, input),
  complete: (id: string) =>
    apiClient.post<ImportProductItem>(`/api/backend/imports/${id}/complete`),
  cancel: (id: string) =>
    apiClient.post<ImportProductItem>(`/api/backend/imports/${id}/cancel`),
  remove: (id: string) =>
    apiClient.delete<void>(`/api/backend/imports/${id}`),
};
