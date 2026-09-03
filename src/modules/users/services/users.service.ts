import { apiClient } from "@/lib/api/client";
import type { User, UserInput, UserList } from "@/modules/users/types/user";
export const usersService = {
  list: (params: { page: number; limit: number; search?: string }) => apiClient.get<UserList>("/api/backend/users", { params }),
  detail: (id: string) => apiClient.get<User>(`/api/backend/users/${id}`),
  create: (input: UserInput & { password: string }) => apiClient.post<User>("/api/backend/users", input),
  update: (id: string, input: Partial<UserInput>) => apiClient.patch<User>(`/api/backend/users/${id}`, input),
  remove: (id: string) => apiClient.delete<void>(`/api/backend/users/${id}`),
};
