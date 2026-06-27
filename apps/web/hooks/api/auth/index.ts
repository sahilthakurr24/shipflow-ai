"use client";

import { trpc } from "~/trpc/client";

// queries
export function useGetSupportedAuthenticationProviders() {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.auth.getSupportedAuthenticationProviders.useQuery();
  return { data, error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetUserById(input: Parameters<typeof trpc.auth.getUserById.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.auth.getUserById.useQuery(input);
  return { user: data?.user, error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetUserByEmail(input: Parameters<typeof trpc.auth.getUserByEmail.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.auth.getUserByEmail.useQuery(input);
  return { user: data?.user, error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useUpdateUser() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateUserAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.auth.updateUser.useMutation({
    onSuccess: async () => {
      await utils.auth.getUserById.invalidate();
    },
  });
  return { updateUserAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteUser() {
  const {
    mutateAsync: deleteUserAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.auth.deleteUser.useMutation();
  return { deleteUserAsync, error, isError, isIdle, isPending, isSuccess, status };
}
