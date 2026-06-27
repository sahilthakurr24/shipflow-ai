"use client";

import { trpc } from "~/trpc/client";

// queries
export function useGetSubscription(
  input: Parameters<typeof trpc.billing.getSubscription.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.billing.getSubscription.useQuery(input);
  return {
    subscription: data?.subscription,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useListPayments(input: Parameters<typeof trpc.billing.listPayments.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.billing.listPayments.useQuery(input);
  return {
    payments: data?.payments ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useListUsageRecords(
  input: Parameters<typeof trpc.billing.listUsageRecords.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.billing.listUsageRecords.useQuery(input);
  return {
    usageRecords: data?.usageRecords ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}
