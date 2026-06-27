"use client";

import { trpc } from "~/trpc/client";

// queries
export function useListReviews(input: Parameters<typeof trpc.review.listReviews.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.review.listReviews.useQuery(input);
  return { reviews: data?.reviews ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

export function useGetReviewById(input: Parameters<typeof trpc.review.getReviewById.useQuery>[0]) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.review.getReviewById.useQuery(input);
  return { review: data?.review, error, isFetched, isFetching, isLoading, refetch, status };
}

export function useListReviewIssues(
  input: Parameters<typeof trpc.review.listReviewIssues.useQuery>[0],
) {
  const { data, error, isFetched, isFetching, isLoading, refetch, status } =
    trpc.review.listReviewIssues.useQuery(input);
  return { issues: data?.issues ?? [], error, isFetched, isFetching, isLoading, refetch, status };
}

// mutations
export function useCreateReview() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createReviewAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.review.createReview.useMutation({
    onSuccess: async () => {
      await utils.review.listReviews.invalidate();
    },
  });
  return { createReviewAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateReview() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateReviewAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.review.updateReview.useMutation({
    onSuccess: async () => {
      await utils.review.listReviews.invalidate();
    },
  });
  return { updateReviewAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useDeleteReview() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteReviewAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.review.deleteReview.useMutation({
    onSuccess: async () => {
      await utils.review.listReviews.invalidate();
    },
  });
  return { deleteReviewAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useCreateReviewIssue() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createReviewIssueAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.review.createReviewIssue.useMutation({
    onSuccess: async () => {
      await utils.review.listReviewIssues.invalidate();
    },
  });
  return { createReviewIssueAsync, error, isError, isIdle, isPending, isSuccess, status };
}

export function useUpdateReviewIssueStatus() {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateReviewIssueStatusAsync,
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.review.updateReviewIssueStatus.useMutation({
    onSuccess: async () => {
      await utils.review.listReviewIssues.invalidate();
    },
  });
  return { updateReviewIssueStatusAsync, error, isError, isIdle, isPending, isSuccess, status };
}
