"use client";

import { trpc } from "~/trpc/client";

// queries
export function useGetUserOrganizations() {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.organization.getUserOrganizations.useQuery();
  return {
    organizations: data?.organizations ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetOrganizationById(
  input: Parameters<typeof trpc.organization.getOrganizationById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.organization.getOrganizationById.useQuery(input);
  return {
    organization: data?.organization,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetOrganizationBySlug(
  input: Parameters<typeof trpc.organization.getOrganizationBySlug.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.organization.getOrganizationBySlug.useQuery(input);
  return {
    organization: data?.organization,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

// mutations
export function useCreateOrganization() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createOrganizationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.organization.createOrganization.useMutation({
    onSuccess: async () => {
      await utils.organization.getUserOrganizations.invalidate();
    },
  });
  return { createOrganizationAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateOrganization() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateOrganizationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.organization.updateOrganization.useMutation({
    onSuccess: async () => {
      await utils.organization.getUserOrganizations.invalidate();
    },
  });
  return { updateOrganizationAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteOrganization() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteOrganizationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.organization.deleteOrganization.useMutation({
    onSuccess: async () => {
      await utils.organization.getUserOrganizations.invalidate();
    },
  });
  return { deleteOrganizationAsync, error, isError, isIdle, isPending, isSuccess, status };
}
