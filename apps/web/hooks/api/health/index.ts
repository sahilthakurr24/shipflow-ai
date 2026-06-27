"use client";

import { trpc } from "~/trpc/client";

// queries
export function useGetHealth() {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.health.getHealth.useQuery();
  return { data, error, isFetched, isFetching, isLoading, refetch, status };
}
