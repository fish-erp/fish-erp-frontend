export type QueryParamValue = string | number | boolean | null | undefined;

export interface ApiClientOptions
  extends Omit<RequestInit, "body" | "method"> {
  params?: Record<string, QueryParamValue>;
  timeout?: number;
  isFormData?: boolean;
  skipAuthRefresh?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
