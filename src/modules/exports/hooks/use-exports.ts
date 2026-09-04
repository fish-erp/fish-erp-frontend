"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exportsService } from "../services/exports.service";
import type { ExportInput, ExportStatus, ExportType } from "../types/export";

export function useExports(params: { page: number; limit: number; search?: string; exportStatus?: ExportStatus; exportType?: ExportType }) {
  return useQuery({ queryKey: ["exports", params], queryFn: ({ signal }) => exportsService.list(params, signal) });
}

export function useExport(id: string) {
  return useQuery({ queryKey: ["exports", id], queryFn: () => exportsService.detail(id), enabled: Boolean(id) });
}

export function useExportMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["exports"] });
    client.invalidateQueries({ queryKey: ["products"] });
  };
  return {
    create: useMutation({ mutationFn: (input: ExportInput) => exportsService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<ExportInput> }) => exportsService.update(id, input), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: exportsService.complete, onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: exportsService.cancel, onSuccess: invalidate }),
    remove: useMutation({ mutationFn: exportsService.remove, onSuccess: invalidate }),
  };
}
