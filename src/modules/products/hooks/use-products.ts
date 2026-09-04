"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsService } from "@/modules/products/services/products.service";
import type {
  ProductInput,
  ProductStatus,
  ProductType,
} from "@/modules/products/types/product";

export function useProducts(params: {
  page: number;
  limit: number;
  search?: string;
  type?: ProductType;
  status?: ProductStatus;
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: ({ signal }) => productsService.list(params, signal),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsService.detail(id),
    enabled: Boolean(id),
  });
}

export function useProductMutations() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: ["products"] });

  return {
    create: useMutation({
      mutationFn: (input: ProductInput) => productsService.create(input),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
        productsService.update(id, input),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: productsService.remove,
      onSuccess: done,
    }),
  };
}
