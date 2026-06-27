"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListApprovals(
  input: Parameters<typeof trpc.approval.listApprovals.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.approval.listApprovals.useQuery(input);
  return {
    approvals: data?.approvals ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetApprovalById(
  input: Parameters<typeof trpc.approval.getApprovalById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.approval.getApprovalById.useQuery(input);
  return { approval: data?.approval, error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useCreateApproval() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createApprovalAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.approval.createApproval.useMutation({
    onSuccess: async () => {
      await utils.approval.listApprovals.invalidate();
    },
  });
  return { createApprovalAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteApproval() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteApprovalAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.approval.deleteApproval.useMutation({
    onSuccess: async () => {
      await utils.approval.listApprovals.invalidate();
    },
  });
  return { deleteApprovalAsync, error, isError, isIdle, isPending, isSuccess, status };
}
