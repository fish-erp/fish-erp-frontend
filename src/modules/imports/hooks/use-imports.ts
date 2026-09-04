"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { importsService } from "@/modules/imports/services/imports.service";
import type {
  CreateImportInput,
  ListImportsParams,
  UpdateImportInput,
} from "@/modules/imports/types/import";

export function useImports(params: ListImportsParams) {
  return useQuery({
    queryKey: ["imports", params],
    queryFn: () => importsService.list(params),
  });
}

export function useImport(id: string) {
  return useQuery({
    queryKey: ["imports", id],
    queryFn: () => importsService.detail(id),
    enabled: Boolean(id),
  });
}

export function useImportMutations() {
  const client = useQueryClient();
  const invalidateAll = () => {
    client.invalidateQueries({ queryKey: ["imports"] });
    client.invalidateQueries({ queryKey: ["products"] });
  };

  return {
    create: useMutation({
      mutationFn: (input: CreateImportInput) => importsService.create(input),
      onSuccess: invalidateAll,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateImportInput }) =>
        importsService.update(id, input),
      onSuccess: invalidateAll,
    }),
    complete: useMutation({
      mutationFn: (id: string) => importsService.complete(id),
      onSuccess: invalidateAll,
    }),
    cancel: useMutation({
      mutationFn: (id: string) => importsService.cancel(id),
      onSuccess: invalidateAll,
    }),
    remove: useMutation({
      mutationFn: (id: string) => importsService.remove(id),
      onSuccess: invalidateAll,
    }),
  };
}
