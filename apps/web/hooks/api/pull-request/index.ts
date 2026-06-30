"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListPullRequests(
  input: Parameters<typeof trpc.pullRequest.listPullRequests.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.pullRequest.listPullRequests.useQuery(input);
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

export function useGetPullRequestById(
  input: Parameters<typeof trpc.pullRequest.getPullRequestById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.pullRequest.getPullRequestById.useQuery(input);
  return {
    pullRequest: data?.pullRequest,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useListPullRequestFiles(
  input: Parameters<typeof trpc.pullRequest.listPullRequestFiles.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.pullRequest.listPullRequestFiles.useQuery(input);
  return { files: data?.files ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useCreatePullRequest() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createPullRequestAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.pullRequest.createPullRequest.useMutation({
    onSuccess: async () => {
      await utils.pullRequest.listPullRequests.invalidate();
    },
  });
  return { createPullRequestAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdatePullRequest() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updatePullRequestAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.pullRequest.updatePullRequest.useMutation({
    onSuccess: async () => {
      await utils.pullRequest.listPullRequests.invalidate();
    },
  });
  return { updatePullRequestAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeletePullRequest() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deletePullRequestAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.pullRequest.deletePullRequest.useMutation({
    onSuccess: async () => {
      await utils.pullRequest.listPullRequests.invalidate();
    },
  });
  return { deletePullRequestAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useRequestReview() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: requestReviewAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.pullRequest.requestReview.useMutation({
    onSuccess: async () => {
      await utils.pullRequest.listPullRequests.invalidate();
    },
  });
  return { requestReviewAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useSyncPullRequests() {
  const utils = trpc.useUtils();
  const { mutateAsync: syncPullRequestsAsync, isPending } =
    trpc.pullRequest.syncFromGithub.useMutation({
      onSuccess: async () => {
        await utils.pullRequest.listPullRequests.invalidate();
      },
    });
  return { syncPullRequestsAsync, isPending };
}

export function useAddPullRequestFile() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: addPullRequestFileAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.pullRequest.addPullRequestFile.useMutation({
    onSuccess: async () => {
      await utils.pullRequest.listPullRequestFiles.invalidate();
    },
  });
  return { addPullRequestFileAsync, error, isError, isIdle, isPending, isSuccess, status };
}
