"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListReleases(input: Parameters<typeof trpc.release.listReleases.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.release.listReleases.useQuery(input);
  return {
    releases: data?.releases ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetReleaseById(
  input: Parameters<typeof trpc.release.getReleaseById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.release.getReleaseById.useQuery(input);
  return { release: data?.release, error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useCreateRelease() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createReleaseAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.release.createRelease.useMutation({
    onSuccess: async () => {
      await utils.release.listReleases.invalidate();
    },
  });
  return { createReleaseAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateRelease() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateReleaseAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.release.updateRelease.useMutation({
    onSuccess: async () => {
      await utils.release.listReleases.invalidate();
    },
  });
  return { updateReleaseAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteRelease() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteReleaseAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.release.deleteRelease.useMutation({
    onSuccess: async () => {
      await utils.release.listReleases.invalidate();
    },
  });
  return { deleteReleaseAsync, error, isError, isIdle, isPending, isSuccess, status };
}
