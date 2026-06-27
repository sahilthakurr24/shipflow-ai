"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListRepositories(
  input: Parameters<typeof trpc.repository.listRepositories.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.listRepositories.useQuery(input);
  return {
    repositories: data?.repositories ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetGithubInstallUrl(
  input: Parameters<typeof trpc.repository.getGithubInstallUrl.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.getGithubInstallUrl.useQuery(input);
  return { url: data?.url, error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetRepositoryById(
  input: Parameters<typeof trpc.repository.getRepositoryById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.getRepositoryById.useQuery(input);
  return { repository: data?.repository, error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useCreateRepository() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createRepositoryAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.repository.createRepository.useMutation({
    onSuccess: async () => {
      await utils.repository.listRepositories.invalidate();
    },
  });
  return { createRepositoryAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useCompleteGithubInstallation() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: completeGithubInstallationAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.repository.completeGithubInstallation.useMutation({
    onSuccess: async () => {
      await utils.repository.listRepositories.invalidate();
    },
  });
  return { completeGithubInstallationAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateRepository() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateRepositoryAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.repository.updateRepository.useMutation({
    onSuccess: async () => {
      await utils.repository.listRepositories.invalidate();
    },
  });
  return { updateRepositoryAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteRepository() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteRepositoryAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.repository.deleteRepository.useMutation({
    onSuccess: async () => {
      await utils.repository.listRepositories.invalidate();
    },
  });
  return { deleteRepositoryAsync, error, isError, isIdle, isPending, isSuccess, status };
}
