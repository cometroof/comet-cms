import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "./api";
import { UserFormData, UserUpdateFormData } from "./types";

// Query Keys
export const QUERY_KEYS = {
  users: ["users"] as const,
  user: (id: number) => ["user", id] as const,
};

// User Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: usersApi.getAll,
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UserFormData) => usersApi.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UserUpdateFormData) => usersApi.update(userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(data.id) });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
};

export const useVerifyPassword = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      usersApi.verifyPassword(email, password),
  });
};
