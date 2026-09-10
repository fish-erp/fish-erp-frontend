import { apiClient } from "@/lib/api/client";

export interface ReportFilter {
  from: string;
  to: string;
  includePrice: boolean;
}

async function download(kind: "inventory" | "sales", filter: ReportFilter): Promise<void> {
  const { blob, fileName } = await apiClient.download(`/api/backend/reports/${kind}.xlsx`, {
    params: { from: filter.from, to: filter.to, includePrice: filter.includePrice },
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const reportsService = {
  inventory: (filter: ReportFilter) => download("inventory", filter),
  sales: (filter: ReportFilter) => download("sales", filter),
};
