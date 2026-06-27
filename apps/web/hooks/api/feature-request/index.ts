"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListFeatureRequests(
  input: Parameters<typeof trpc.featureRequest.listFeatureRequests.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.featureRequest.listFeatureRequests.useQuery(input);
  return {
    featureRequests: data?.featureRequests ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetFeatureRequestById(
  input: Parameters<typeof trpc.featureRequest.getFeatureRequestById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.featureRequest.getFeatureRequestById.useQuery(input);
  return {
    featureRequest: data?.featureRequest,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useListClarificationMessages(
  input: Parameters<typeof trpc.featureRequest.listClarificationMessages.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.featureRequest.listClarificationMessages.useQuery(input);
  return {
    messages: data?.messages ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

// mutations
export function useCreateFeatureRequest() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createFeatureRequestAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.featureRequest.createFeatureRequest.useMutation({
    onSuccess: async () => {
      await utils.featureRequest.listFeatureRequests.invalidate();
    },
  });
  return { createFeatureRequestAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateFeatureRequest() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateFeatureRequestAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.featureRequest.updateFeatureRequest.useMutation({
    onSuccess: async () => {
      await utils.featureRequest.listFeatureRequests.invalidate();
    },
  });
  return { updateFeatureRequestAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteFeatureRequest() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteFeatureRequestAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.featureRequest.deleteFeatureRequest.useMutation({
    onSuccess: async () => {
      await utils.featureRequest.listFeatureRequests.invalidate();
    },
  });
  return { deleteFeatureRequestAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useAddClarificationMessage() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: addClarificationMessageAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.featureRequest.addClarificationMessage.useMutation({
    onSuccess: async () => {
      await utils.featureRequest.listClarificationMessages.invalidate();
    },
  });
  return { addClarificationMessageAsync, error, isError, isIdle, isPending, isSuccess, status };
}
