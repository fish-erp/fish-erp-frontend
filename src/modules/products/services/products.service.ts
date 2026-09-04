import { apiClient } from "@/lib/api/client";
import type {
  Product,
  ProductInput,
  ProductList,
  ProductStatus,
  ProductType,
} from "@/modules/products/types/product";

export const productsService = {
  list: (params: {
    page: number;
    limit: number;
    search?: string;
    type?: ProductType;
    status?: ProductStatus;
  }) => apiClient.get<ProductList>("/api/backend/products", { params }),
  detail: (id: string) => apiClient.get<Product>(`/api/backend/products/${id}`),
  create: (input: ProductInput) =>
    apiClient.post<Product>("/api/backend/products", input),
  update: (id: string, input: Partial<ProductInput>) =>
    apiClient.patch<Product>(`/api/backend/products/${id}`, input),
  remove: (id: string) => apiClient.delete<void>(`/api/backend/products/${id}`),
};
