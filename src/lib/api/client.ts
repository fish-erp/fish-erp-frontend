import { ApiError } from "@/lib/api/errors";
import type { ApiClientOptions, QueryParamValue } from "@/types/api";

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then((response) => response.ok).catch(() => false)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

class ApiClient {
  private buildUrl(endpoint: string, params?: Record<string, QueryParamValue>): string {
    const base = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(endpoint, base);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
    });
    return typeof window === "undefined" ? `${url.pathname}${url.search}` : url.toString();
  }

  private async parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined;
    return response.headers.get("content-type")?.includes("application/json") ? response.json() : response.text();
  }

  private async request<T>(endpoint: string, method: string, body?: unknown, options: ApiClientOptions = {}, retried = false): Promise<T> {
    const { params, timeout = 30_000, isFormData = false, headers: customHeaders, signal: callerSignal, skipAuthRefresh = false, ...requestInit } = options;
    const controller = new AbortController();
    const abort = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) abort(); else callerSignal?.addEventListener("abort", abort, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const headers = new Headers(customHeaders);
    headers.set("Accept", "application/json");
    let requestBody: BodyInit | undefined;
    if (body !== undefined) {
      const formData = isFormData || (typeof FormData !== "undefined" && body instanceof FormData);
      if (!formData) headers.set("Content-Type", "application/json");
      requestBody = formData ? body as BodyInit : JSON.stringify(body);
    }
    try {
      const response = await fetch(this.buildUrl(endpoint, params), { ...requestInit, method, headers, body: requestBody, signal: controller.signal, credentials: "include" });
      if (response.status === 401 && !skipAuthRefresh && !retried && await refreshSession()) return this.request<T>(endpoint, method, body, options, true);
      const data = await this.parseResponse(response);
      if (!response.ok) {
        const raw = typeof data === "object" && data !== null && "message" in data ? data.message : undefined;
        const message = Array.isArray(raw) ? raw.join(" · ") : typeof raw === "string" ? raw : `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, data);
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new ApiError("Yêu cầu đã hết thời gian chờ.", 408);
      throw new ApiError(error instanceof Error ? error.message : "Không thể kết nối máy chủ.", 0);
    } finally {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", abort);
    }
  }
  get<T>(endpoint: string, options?: ApiClientOptions) { return this.request<T>(endpoint, "GET", undefined, options); }
  post<T>(endpoint: string, body?: unknown, options?: ApiClientOptions) { return this.request<T>(endpoint, "POST", body, options); }
  put<T>(endpoint: string, body?: unknown, options?: ApiClientOptions) { return this.request<T>(endpoint, "PUT", body, options); }
  patch<T>(endpoint: string, body?: unknown, options?: ApiClientOptions) { return this.request<T>(endpoint, "PATCH", body, options); }
  delete<T>(endpoint: string, options?: ApiClientOptions) { return this.request<T>(endpoint, "DELETE", undefined, options); }

  async download(endpoint: string, options: ApiClientOptions = {}, retried = false): Promise<{ blob: Blob; fileName: string }> {
    const { params, timeout = 120_000, signal: callerSignal } = options;
    const controller = new AbortController();
    const abort = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) abort(); else callerSignal?.addEventListener("abort", abort, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(this.buildUrl(endpoint, params), {
        method: "GET",
        headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        credentials: "include",
        signal: controller.signal,
      });
      if (response.status === 401 && !retried && await refreshSession()) {
        return this.download(endpoint, options, true);
      }
      if (!response.ok) {
        const data = await this.parseResponse(response);
        const raw = typeof data === "object" && data !== null && "message" in data ? data.message : undefined;
        throw new ApiError(typeof raw === "string" ? raw : "Không thể tải file báo cáo", response.status, data);
      }
      const disposition = response.headers.get("content-disposition") ?? "";
      const fileName = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "bao-cao.xlsx";
      return { blob: await response.blob(), fileName };
    } finally {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", abort);
    }
  }
}

export const apiClient = new ApiClient();
