"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListWorkflowRuns(
  input: Parameters<typeof trpc.workflow.listWorkflowRuns.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.workflow.listWorkflowRuns.useQuery(input);
  return {
    workflowRuns: data?.workflowRuns ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetWorkflowRunById(
  input: Parameters<typeof trpc.workflow.getWorkflowRunById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.workflow.getWorkflowRunById.useQuery(input);
  return {
    workflowRun: data?.workflowRun,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}
