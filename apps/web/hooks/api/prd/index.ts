"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListPrds(input: Parameters<typeof trpc.prd.listPrds.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.prd.listPrds.useQuery(input);
  return { prds: data?.prds ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetPrdById(input: Parameters<typeof trpc.prd.getPrdById.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.prd.getPrdById.useQuery(input);
  return { prd: data?.prd, error, isFetched, isFetching, isLoading, refetch, status };
}

export function useListUserStories(input: Parameters<typeof trpc.prd.listUserStories.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.prd.listUserStories.useQuery(input);
  return {
    userStories: data?.userStories ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useListAcceptanceCriteria(
  input: Parameters<typeof trpc.prd.listAcceptanceCriteria.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.prd.listAcceptanceCriteria.useQuery(input);
  return {
    acceptanceCriteria: data?.acceptanceCriteria ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

// mutations
export function useCreatePrd() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createPrdAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.prd.createPrd.useMutation({
    onSuccess: async () => {
      await utils.prd.listPrds.invalidate();
    },
  });
  return { createPrdAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdatePrd() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updatePrdAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.prd.updatePrd.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.prd.listPrds.invalidate(), utils.prd.getPrdById.invalidate()]);
    },
  });
  return { updatePrdAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeletePrd() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deletePrdAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.prd.deletePrd.useMutation({
    onSuccess: async () => {
      await utils.prd.listPrds.invalidate();
    },
  });
  return { deletePrdAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useApprovePrd() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: approvePrdAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.prd.approvePrd.useMutation({
    onSuccess: async () => {
      await utils.prd.listPrds.invalidate();
    },
  });
  return { approvePrdAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useCreateUserStory() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createUserStoryAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.prd.createUserStory.useMutation({
    onSuccess: async () => {
      await utils.prd.listUserStories.invalidate();
    },
  });
  return { createUserStoryAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useCreateAcceptanceCriteria() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createAcceptanceCriteriaAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.prd.createAcceptanceCriteria.useMutation({
    onSuccess: async () => {
      await utils.prd.listAcceptanceCriteria.invalidate();
    },
  });
  return { createAcceptanceCriteriaAsync, error, isError, isIdle, isPending, isSuccess, status };
}
