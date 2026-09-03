"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/modules/users/services/users.service";
import type { UserInput } from "@/modules/users/types/user";
export function useUsers(params: { page: number; limit: number; search?: string }) { return useQuery({ queryKey: ["users", params], queryFn: () => usersService.list(params) }); }
export function useUser(id: string) { return useQuery({ queryKey: ["users", id], queryFn: () => usersService.detail(id), enabled: Boolean(id) }); }
export function useUserMutations() { const client = useQueryClient(); const done = () => client.invalidateQueries({ queryKey: ["users"] }); return { create: useMutation({ mutationFn: (input: UserInput & { password: string }) => usersService.create(input), onSuccess: done }), update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<UserInput> }) => usersService.update(id, input), onSuccess: done }), remove: useMutation({ mutationFn: usersService.remove, onSuccess: done }) }; }
