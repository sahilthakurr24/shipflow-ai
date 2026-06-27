"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListWebhookEvents(
  input: Parameters<typeof trpc.webhook.listWebhookEvents.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.webhook.listWebhookEvents.useQuery(input);
  return {
    webhookEvents: data?.webhookEvents ?? [],
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}

export function useGetWebhookEventById(
  input: Parameters<typeof trpc.webhook.getWebhookEventById.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.webhook.getWebhookEventById.useQuery(input);
  return {
    webhookEvent: data?.webhookEvent,
    error,
    isFetched,
    isFetching,
    isLoading,
    refetch,
    status,
  };
}
