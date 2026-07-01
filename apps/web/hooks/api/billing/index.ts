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

export function useListPlans() {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.billing.listPlans.useQuery(undefined);
  return {
    plans: data?.plans ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

// mutations
export function useCreateCheckoutSubscription() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createCheckoutSubscriptionAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.billing.createCheckoutSubscription.useMutation({
    onSuccess: async () => {
      await utils.billing.getSubscription.invalidate();
    },
  });
  return { createCheckoutSubscriptionAsync, error, isError, isPending, isSuccess, status };
}

export function useCancelSubscription() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: cancelSubscriptionAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.billing.cancelSubscription.useMutation({
    onSuccess: async () => {
      await utils.billing.getSubscription.invalidate();
    },
  });
  return { cancelSubscriptionAsync, error, isError, isPending, isSuccess, status };
}
