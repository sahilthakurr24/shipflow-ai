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
  // Always recompute from the server (it depends on the App slug in env) and
  // never serve a stale value — staleTime 0 refetches on every mount.
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.getGithubInstallUrl.useQuery(input, { staleTime: 0 });
  return { url: data?.url, error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetRepositoryById(
  input: Parameters<typeof trpc.repository.getRepositoryById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.getRepositoryById.useQuery(input);
  return { repository: data?.repository, error, isFetched, isFetching, isLoading, refetch, status };
}

// Live GitHub reads — finite staleTime so they revalidate (global default is Infinity).
const LIVE_STALE_TIME = 60 * 1000;

export function useGetRepoBranches(
  input: Parameters<typeof trpc.repository.getRepoBranches.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.getRepoBranches.useQuery(input, { staleTime: LIVE_STALE_TIME });
  return { branches: data?.branches ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetRepoCommits(
  input: Parameters<typeof trpc.repository.getRepoCommits.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.getRepoCommits.useQuery(input, { staleTime: LIVE_STALE_TIME });
  return { commits: data?.commits ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetRepoOpenPullRequests(
  input: Parameters<typeof trpc.repository.getRepoOpenPullRequests.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.repository.getRepoOpenPullRequests.useQuery(input, { staleTime: LIVE_STALE_TIME });
  return {
    pullRequests: data?.pullRequests ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
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
